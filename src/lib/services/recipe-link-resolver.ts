import type { DailyBriefRecipe, RecipeSampleLink } from "@/types/daily-brief";
import { isGenericRecipeLink } from "@/lib/recipe-link-utils";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

let innerTubeCache: { apiKey: string; clientVersion: string; fetchedAt: number } | null = null;
const INNERTUBE_TTL_MS = 60 * 60 * 1000;

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2)
  );
}

function scoreRecipeMatch(title: string, recipe: DailyBriefRecipe): number {
  const recipeTokens = tokenize(`${recipe.subtitle} ${recipe.title} ${recipe.ingredients.join(" ")}`);
  const titleTokens = Array.from(tokenize(title));
  if (!titleTokens.length) return 0;
  let score = 0;
  for (const token of titleTokens) {
    if (recipeTokens.has(token)) score += 2;
  }
  const subtitleTokens = Array.from(tokenize(recipe.subtitle));
  for (const token of subtitleTokens) {
    if (title.toLowerCase().includes(token)) score += 3;
  }
  return score;
}

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Build a precise search query from the full generated recipe. */
export function buildRecipeSearchQuery(recipe: DailyBriefRecipe): string {
  const ingredients = recipe.ingredients.slice(0, 6).join(" ");
  const technique = recipe.steps[0]?.replace(/\.$/, "") ?? "";
  return [recipe.subtitle, ingredients, technique].filter(Boolean).join(" ").trim();
}

async function getInnerTubeConfig(): Promise<{ apiKey: string; clientVersion: string }> {
  if (innerTubeCache && Date.now() - innerTubeCache.fetchedAt < INNERTUBE_TTL_MS) {
    return innerTubeCache;
  }

  const res = await fetch("https://www.youtube.com", {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(8000),
  });
  const html = await res.text();
  const apiKey = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1];
  const clientVersion = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/)?.[1] ?? "2.20260101.00.00";
  if (!apiKey) throw new Error("Could not read YouTube config");

  innerTubeCache = { apiKey, clientVersion, fetchedAt: Date.now() };
  return innerTubeCache;
}

type YoutubeCandidate = { videoId: string; title: string; url: string };

async function searchYoutubeCandidates(query: string): Promise<YoutubeCandidate[]> {
  const { apiKey, clientVersion } = await getInnerTubeConfig();
  const res = await fetch(`https://www.youtube.com/youtubei/v1/search?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
    },
    body: JSON.stringify({
      context: {
        client: { clientName: "WEB", clientVersion, hl: "en", gl: "US" },
      },
      query,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`YouTube search failed (${res.status})`);

  const data = (await res.json()) as {
    contents?: {
      twoColumnSearchResultsRenderer?: {
        primaryContents?: {
          sectionListRenderer?: {
            contents?: Array<{
              itemSectionRenderer?: {
                contents?: Array<{
                  videoRenderer?: {
                    videoId?: string;
                    title?: { runs?: Array<{ text?: string }> };
                  };
                }>;
              };
            }>;
          };
        };
      };
    };
  };

  const items =
    data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]
      ?.itemSectionRenderer?.contents ?? [];

  const candidates: YoutubeCandidate[] = [];
  for (const item of items) {
    const video = item.videoRenderer;
    if (!video?.videoId) continue;
    const title = video.title?.runs?.[0]?.text?.trim();
    if (!title) continue;
    candidates.push({
      videoId: video.videoId,
      title,
      url: `https://www.youtube.com/watch?v=${video.videoId}`,
    });
    if (candidates.length >= 8) break;
  }

  return candidates;
}

async function resolveYoutubeLink(recipe: DailyBriefRecipe): Promise<RecipeSampleLink | null> {
  const query = `${buildRecipeSearchQuery(recipe)} recipe`;
  const candidates = await searchYoutubeCandidates(query);
  if (!candidates.length) return null;

  const ranked = candidates.slice().sort(
    (a, b) => scoreRecipeMatch(b.title, recipe) - scoreRecipeMatch(a.title, recipe)
  );
  const best = ranked[0];
  return {
    title: best.title,
    url: best.url,
    type: "youtube",
  };
}

async function resolveArticleLink(recipe: DailyBriefRecipe): Promise<RecipeSampleLink | null> {
  const baseQuery = buildRecipeSearchQuery(recipe);
  const queries = [
    `${baseQuery} recipe site:bbcgoodfood.com`,
    `${recipe.subtitle} ${recipe.ingredients.slice(0, 4).join(" ")} recipe site:bbcgoodfood.com`,
  ];

  for (const query of queries) {
    const res = await fetch(`https://search.brave.com/search?q=${encodeURIComponent(query)}&source=web`, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) continue;

    const html = await res.text();
    const urls = Array.from(
      new Set(
        Array.from(html.matchAll(/https:\/\/www\.bbcgoodfood\.com\/recipes\/[a-z0-9-]+/g)).map((m) => m[0])
      )
    ).filter((url) => !url.endsWith("/collection") && !url.includes("/how-to-"));

    if (!urls.length) continue;

    const ranked = urls
      .map((url) => {
        const slug = url.split("/").pop() ?? "";
        const title = slugToTitle(slug);
        return { url, title, score: scoreRecipeMatch(title, recipe) };
      })
      .sort((a, b) => b.score - a.score);

    const best = ranked[0];
    if (!best) continue;

    return {
      title: best.title,
      url: best.url.split("?")[0],
      type: "article",
    };
  }

  return null;
}

function fallbackLinks(recipe: DailyBriefRecipe): RecipeSampleLink[] {
  const query = encodeURIComponent(buildRecipeSearchQuery(recipe));
  return [
    {
      title: `Find videos for ${recipe.subtitle}`,
      url: `https://www.youtube.com/results?search_query=${query}`,
      type: "youtube",
    },
    {
      title: `Find articles for ${recipe.subtitle}`,
      url: `https://search.brave.com/search?q=${encodeURIComponent(`${buildRecipeSearchQuery(recipe)} recipe site:bbcgoodfood.com`)}`,
      type: "article",
    },
  ];
}

/** Resolve direct YouTube video + BBC Good Food recipe URLs for this exact dish. */
export async function resolveRecipeSampleLinks(recipe: DailyBriefRecipe): Promise<RecipeSampleLink[]> {
  const [youtube, article] = await Promise.allSettled([
    resolveYoutubeLink(recipe),
    resolveArticleLink(recipe),
  ]);

  const links: RecipeSampleLink[] = [];
  if (youtube.status === "fulfilled" && youtube.value) links.push(youtube.value);
  if (article.status === "fulfilled" && article.value) links.push(article.value);

  if (links.length >= 2) return links;
  if (links.length === 1) {
    const fallbacks = fallbackLinks(recipe);
    const missingType = links[0].type === "youtube" ? "article" : "youtube";
    const extra = fallbacks.find((l) => l.type === missingType);
    if (extra) links.push(extra);
    return links;
  }

  return fallbackLinks(recipe);
}

export async function attachRecipeSampleLinks(recipe: DailyBriefRecipe): Promise<DailyBriefRecipe> {
  const needsResolve =
    !recipe.sampleLinks?.length ||
    recipe.sampleLinks.some((link) => isGenericRecipeLink(link.url));

  if (!needsResolve) return recipe;

  const sampleLinks = await resolveRecipeSampleLinks(recipe);
  return { ...recipe, sampleLinks };
}

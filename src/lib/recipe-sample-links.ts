import type { DailyBriefRecipe, RecipeSampleLink } from "@/types/daily-brief";

function encodeQuery(text: string): string {
  return encodeURIComponent(text.trim());
}

/** Build reliable search links for recipe inspiration (no hallucinated video IDs). */
export function buildRecipeSampleLinks(recipe: DailyBriefRecipe): RecipeSampleLink[] {
  const base = `${recipe.subtitle} toddler recipe`;
  const query = encodeQuery(base);
  return [
    {
      title: `Watch ${recipe.subtitle} on YouTube`,
      url: `https://www.youtube.com/results?search_query=${query}`,
      type: "youtube",
    },
    {
      title: `${recipe.subtitle} — recipe articles & guides`,
      url: `https://www.google.com/search?q=${query}`,
      type: "article",
    },
  ];
}

export function withRecipeSampleLinks(recipe: DailyBriefRecipe): DailyBriefRecipe {
  const links =
    recipe.sampleLinks?.length && recipe.sampleLinks.every((l) => l.url?.startsWith("http"))
      ? recipe.sampleLinks
      : buildRecipeSampleLinks(recipe);
  return { ...recipe, sampleLinks: links };
}

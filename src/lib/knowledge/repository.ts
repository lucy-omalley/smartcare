import "server-only";

import { createHash } from "crypto";
import type { BriefProfile } from "@/lib/daily-brief-context";
import { parseChildAgeMonths } from "@/lib/child-development";
import { resolveChildAgeDisplay } from "@/lib/child-age";
import { prisma } from "@/lib/db";
import type { WeatherInfo } from "@/types/daily-brief";
import type {
  DailyBriefDevelopment,
  DailyBriefPlay,
  DailyBriefRecipe,
  DailyBriefStory,
  LibraryRecommendation,
} from "@/types/daily-brief";
import type { KnowledgeScoringPool } from "@/lib/intelligence/types";

export interface PlanContext {
  ageMonths: number | null;
  ageYears: number | null;
  isWeekend: boolean;
  weather: WeatherInfo | null;
  isRainy: boolean;
  isSunny: boolean;
}

export interface KnowledgeCandidates {
  recipes: Array<{ slug: string; subtitle: string; prepTimeMinutes: number; tags: string[] }>;
  activities: Array<{ slug: string; title: string; indoorOutdoor: string; durationMinutes: number; tags: string[] }>;
  stories: Array<{ slug: string; theme: string; tags: string[] }>;
  tips: Array<{ slug: string; title: string; category: string }>;
  milestones: Array<{ slug: string; title: string; category: string }>;
  books: Array<{ slug: string; title: string; theme: string }>;
}

export interface RotateLibraryPoolsShape {
  recipes: DailyBriefRecipe[];
  play: DailyBriefPlay[];
  stories: DailyBriefStory[];
  language: DailyBriefDevelopment[];
}

function ageFilter(minAgeMonths: number, maxAgeMonths: number, ageMonths: number | null) {
  if (ageMonths === null) return {};
  return { minAgeMonths: { lte: ageMonths }, maxAgeMonths: { gte: ageMonths } };
}

export function buildPlanContext(
  profile: BriefProfile,
  weather: WeatherInfo | null,
  date = new Date()
): PlanContext {
  const display = resolveChildAgeDisplay(profile);
  const ageMonths = parseChildAgeMonths(display ?? profile.childAge, profile.childBirthday);
  const day = date.getDay();
  const isRainy = weather?.isRainy ?? weather?.description?.toLowerCase().includes("rain") ?? false;
  const isSunny =
    Boolean(weather?.description?.toLowerCase().includes("sun")) ||
    Boolean(weather?.description?.toLowerCase().includes("clear"));

  return {
    ageMonths,
    ageYears: ageMonths === null ? null : ageMonths / 12,
    isWeekend: day === 0 || day === 6,
    weather,
    isRainy,
    isSunny,
  };
}

export function buildSemanticCacheKey(profile: BriefProfile, ctx: PlanContext): string {
  const payload = {
    age: ctx.ageMonths ?? profile.childAge,
    gender: profile.childGender,
    goals: [...(profile.parentingGoals ?? [])].sort(),
    priority: profile.priorityGoal,
    interests: [...(profile.childInterests ?? [])].sort(),
    weather: ctx.weather?.description ?? "unknown",
    weekend: ctx.isWeekend,
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, 32);
}

function scoreTags(itemTags: string[], profileTags: string[]): number {
  if (!profileTags.length) return 0;
  const set = new Set(profileTags.map((t) => t.toLowerCase()));
  return itemTags.filter((t) => set.has(t.toLowerCase())).length;
}

export async function fetchKnowledgeCandidates(
  profile: BriefProfile,
  ctx: PlanContext
): Promise<KnowledgeCandidates> {
  const ageWhere = ageFilter(0, 216, ctx.ageMonths);
  const profileTags = [
    ...(profile.childInterests ?? []),
    ...(profile.priorityGoal ? [profile.priorityGoal] : []),
    ...(profile.parentingGoals ?? []),
  ];

  const activityWhere = {
    active: true,
    ...ageWhere,
    ...(ctx.isRainy ? { rainyDay: true } : {}),
    ...(ctx.isSunny && !ctx.isRainy ? { sunnyDay: true } : {}),
  };

  const [recipes, activities, stories, tips, milestones, books] = await Promise.all([
    prisma.knowledgeRecipe.findMany({ where: { active: true, ...ageWhere }, take: 30 }),
    prisma.knowledgeActivity.findMany({ where: activityWhere, take: 30 }),
    prisma.knowledgeStory.findMany({ where: { active: true, ...ageWhere }, take: 20 }),
    prisma.knowledgeTip.findMany({ where: { active: true, ...ageWhere }, take: 20 }),
    prisma.knowledgeMilestone.findMany({ where: { active: true, ...ageWhere }, take: 15 }),
    prisma.knowledgeBook.findMany({ where: { active: true, ...ageWhere }, take: 10 }),
  ]);

  const rank = <T extends { tags: string[] }>(items: T[]) =>
    [...items].sort((a, b) => scoreTags(b.tags, profileTags) - scoreTags(a.tags, profileTags));

  return {
    recipes: rank(recipes).slice(0, 5).map((r) => ({
      slug: r.slug,
      subtitle: r.subtitle,
      prepTimeMinutes: r.prepTimeMinutes,
      tags: r.tags,
    })),
    activities: rank(activities).slice(0, 5).map((a) => ({
      slug: a.slug,
      title: a.title,
      indoorOutdoor: a.indoorOutdoor,
      durationMinutes: a.durationMinutes,
      tags: a.tags,
    })),
    stories: rank(stories).slice(0, 3).map((s) => ({
      slug: s.slug,
      theme: s.theme,
      tags: s.tags,
    })),
    tips: rank(tips).slice(0, 5).map((t) => ({ slug: t.slug, title: t.title, category: t.category })),
    milestones: rank(milestones).slice(0, 3).map((m) => ({ slug: m.slug, title: m.title, category: m.category })),
    books: rank(books).slice(0, 3).map((b) => ({ slug: b.slug, title: b.title, theme: b.theme })),
  };
}

/** Full candidate pool for Parent Intelligence Engine scoring */
export async function fetchKnowledgeScoringPool(
  profile: BriefProfile,
  ctx: PlanContext
): Promise<KnowledgeScoringPool> {
  const ageWhere = ageFilter(0, 216, ctx.ageMonths);
  const activityWhere = {
    active: true,
    ...ageWhere,
    ...(ctx.isRainy ? { rainyDay: true } : {}),
    ...(ctx.isSunny && !ctx.isRainy ? { sunnyDay: true } : {}),
  };

  const [recipes, activities, stories, tips, milestones] = await Promise.all([
    prisma.knowledgeRecipe.findMany({ where: { active: true, ...ageWhere }, take: 40 }),
    prisma.knowledgeActivity.findMany({ where: activityWhere, take: 40 }),
    prisma.knowledgeStory.findMany({ where: { active: true, ...ageWhere }, take: 30 }),
    prisma.knowledgeTip.findMany({ where: { active: true, ...ageWhere }, take: 30 }),
    prisma.knowledgeMilestone.findMany({ where: { active: true, ...ageWhere }, take: 20 }),
  ]);

  return {
    recipes: recipes.map((r) => ({
      slug: r.slug,
      subtitle: r.subtitle,
      ingredients: r.ingredients,
      tags: r.tags,
      minAgeMonths: r.minAgeMonths,
      maxAgeMonths: r.maxAgeMonths,
      whyThisMeal: r.whyThisMeal,
      nutritionTags: r.nutritionTags,
    })),
    activities: activities.map((a) => ({
      slug: a.slug,
      title: a.title,
      tags: a.tags,
      minAgeMonths: a.minAgeMonths,
      maxAgeMonths: a.maxAgeMonths,
      indoorOutdoor: a.indoorOutdoor,
      rainyDay: a.rainyDay,
      sunnyDay: a.sunnyDay,
      skillsDeveloped: a.skillsDeveloped,
      materials: a.materials,
      reason: a.reason,
    })),
    stories: stories.map((s) => ({
      slug: s.slug,
      theme: s.theme,
      tags: s.tags,
      minAgeMonths: s.minAgeMonths,
      maxAgeMonths: s.maxAgeMonths,
      titleTemplate: s.titleTemplate,
    })),
    tips: tips.map((t) => ({
      slug: t.slug,
      title: t.title,
      category: t.category,
      tags: t.tags,
      content: t.content,
      tryToday: t.tryToday,
      minAgeMonths: t.minAgeMonths,
      maxAgeMonths: t.maxAgeMonths,
    })),
    milestones: milestones.map((m) => ({
      slug: m.slug,
      title: m.title,
      category: m.category,
      tags: m.tags,
      minAgeMonths: m.minAgeMonths,
      maxAgeMonths: m.maxAgeMonths,
    })),
  };
}

function personalizeStoryText(template: string, childNickname: string): string {
  return template.replace(/\{child\}/g, childNickname);
}

export async function loadRecipeBySlug(slug: string): Promise<DailyBriefRecipe | null> {
  const r = await prisma.knowledgeRecipe.findUnique({ where: { slug } });
  if (!r) return null;
  return {
    title: r.title,
    subtitle: r.subtitle,
    prepTimeMinutes: r.prepTimeMinutes,
    whyThisMeal: r.whyThisMeal ?? "Recommended because this balanced meal suits your child's stage.",
    ingredients: r.ingredients,
    steps: r.steps,
    detailedSteps: r.detailedSteps.length ? r.detailedSteps : undefined,
    healthyTip: r.healthyTip ?? undefined,
    nutritionalHighlights: r.nutritionTags,
    difficulty: "Easy",
  };
}

export async function loadActivityBySlug(slug: string): Promise<DailyBriefPlay | null> {
  const a = await prisma.knowledgeActivity.findUnique({ where: { slug } });
  if (!a) return null;
  return {
    title: a.title,
    materials: a.materials,
    instructions: a.instructions,
    detailedInstructions: a.detailedInstructions.length ? a.detailedInstructions : undefined,
    skillsDeveloped: a.skillsDeveloped,
    durationMinutes: a.durationMinutes,
    indoorOutdoor: a.indoorOutdoor as DailyBriefPlay["indoorOutdoor"],
    ageRecommendation: `${Math.floor(a.minAgeMonths / 12)}-${Math.ceil(a.maxAgeMonths / 12)} years`,
    reason: a.reason ?? undefined,
  };
}

export async function loadStoryBySlug(slug: string, childNickname: string): Promise<DailyBriefStory | null> {
  const s = await prisma.knowledgeStory.findUnique({ where: { slug } });
  if (!s) return null;
  const child = childNickname || "your little one";
  return {
    title: personalizeStoryText(s.titleTemplate, child),
    story: personalizeStoryText(s.storyTemplate, child),
    lengthMinutes: s.lengthMinutes,
    theme: s.theme,
    moral: s.moral ?? undefined,
    reason: s.reason ?? undefined,
    ageSuitability: `${Math.floor(s.minAgeMonths / 12)}-${Math.ceil(s.maxAgeMonths / 12)} years`,
  };
}

export async function loadTipAsDevelopment(slug: string): Promise<DailyBriefDevelopment | null> {
  const t = await prisma.knowledgeTip.findUnique({ where: { slug } });
  if (!t) return null;
  return {
    domain: t.category === "SPEECH" ? "Language" : "Development",
    icon: t.category === "SPEECH" ? "💬" : "💡",
    insight: t.content,
    tryToday: t.tryToday ?? t.title,
    reason: `Recommended because this supports ${t.category.toLowerCase().replace("_", " ")} at this stage.`,
  };
}

export async function loadMilestone(slug: string) {
  return prisma.knowledgeMilestone.findUnique({ where: { slug } });
}

export async function fetchKnowledgeRotatePool(
  profile: BriefProfile,
  ctx: PlanContext,
  section: "recipe" | "play" | "story" | "language",
  limit = 24
): Promise<RotateLibraryPoolsShape> {
  const ageWhere = ageFilter(0, 216, ctx.ageMonths);
  const empty: RotateLibraryPoolsShape = { recipes: [], play: [], stories: [], language: [] };

  if (section === "recipe") {
    const rows = await prisma.knowledgeRecipe.findMany({ where: { active: true, ...ageWhere }, take: limit });
    const recipes = (await Promise.all(rows.map((r) => loadRecipeBySlug(r.slug)))).filter(
      (r): r is DailyBriefRecipe => r !== null
    );
    return { ...empty, recipes };
  }
  if (section === "play") {
    const rows = await prisma.knowledgeActivity.findMany({ where: { active: true, ...ageWhere }, take: limit });
    const play = (await Promise.all(rows.map((a) => loadActivityBySlug(a.slug)))).filter(
      (p): p is DailyBriefPlay => p !== null
    );
    return { ...empty, play };
  }
  if (section === "story") {
    const child = profile.childNickname ?? "your little one";
    const rows = await prisma.knowledgeStory.findMany({ where: { active: true, ...ageWhere }, take: limit });
    const stories = (await Promise.all(rows.map((s) => loadStoryBySlug(s.slug, child)))).filter(
      (s): s is DailyBriefStory => s !== null
    );
    return { ...empty, stories };
  }
  const rows = await prisma.knowledgeTip.findMany({
    where: { active: true, ...ageWhere, category: { in: ["SPEECH", "GENERAL", "EMOTIONAL"] } },
    take: limit,
  });
  const language = (await Promise.all(rows.map((t) => loadTipAsDevelopment(t.slug)))).filter(
    (l): l is DailyBriefDevelopment => l !== null
  );
  return { ...empty, language };
}

export async function fetchAllKnowledgeRotatePools(
  profile: BriefProfile,
  ctx: PlanContext
): Promise<RotateLibraryPoolsShape> {
  const [recipes, play, stories, language] = await Promise.all([
    fetchKnowledgeRotatePool(profile, ctx, "recipe"),
    fetchKnowledgeRotatePool(profile, ctx, "play"),
    fetchKnowledgeRotatePool(profile, ctx, "story"),
    fetchKnowledgeRotatePool(profile, ctx, "language"),
  ]);
  return {
    recipes: recipes.recipes,
    play: play.play,
    stories: stories.stories,
    language: language.language,
  };
}

export async function fetchLibraryArticles(
  profile: BriefProfile,
  ctx: PlanContext
): Promise<LibraryRecommendation[]> {
  const tips = await prisma.knowledgeTip.findMany({
    where: { active: true, ...ageFilter(0, 216, ctx.ageMonths) },
    take: 12,
  });
  const books = await prisma.knowledgeBook.findMany({
    where: { active: true, ...ageFilter(0, 216, ctx.ageMonths) },
    take: 6,
  });
  const articles = await fetchPublishedArticles(profile, ctx, 6);

  const fromTips: LibraryRecommendation[] = tips.map((t) => ({
    title: t.title,
    summary: t.content.slice(0, 280),
    relevance: `Matches ${t.category.toLowerCase()} support for your child's age.`,
    slug: t.slug,
    type: "tip" as const,
  }));

  const fromBooks: LibraryRecommendation[] = books.map((b) => ({
    title: b.title,
    summary: b.summary.slice(0, 280),
    relevance: `Theme: ${b.theme} — suitable for ${profile.childAge ?? "young children"}.`,
    slug: b.slug,
    type: "book" as const,
  }));

  const fromArticles: LibraryRecommendation[] = articles.map((a) => ({
    title: a.title,
    summary: (a.summary ?? a.body).slice(0, 280),
    relevance: `${a.category.toLowerCase()} guide for your family.`,
    slug: a.slug,
    type: "article" as const,
  }));

  return [...fromTips, ...fromBooks, ...fromArticles].slice(0, 16);
}

export async function fetchWeeklyFocusCandidates(profile: BriefProfile, ctx: PlanContext) {
  const ageWhere = ageFilter(0, 216, ctx.ageMonths);
  const profileTags = [
    ...(profile.childInterests ?? []),
    ...(profile.priorityGoal ? [profile.priorityGoal] : []),
    ...(profile.parentingGoals ?? []),
  ];

  const themes = await prisma.knowledgeWeeklyTheme.findMany({
    where: { active: true, ...ageWhere },
    take: 30,
  });

  const rank = <T extends { tags: string[] }>(items: T[]) =>
    [...items].sort((a, b) => scoreTags(b.tags, profileTags) - scoreTags(a.tags, profileTags));

  return rank(themes).map((t) => ({
    slug: t.slug,
    title: t.title,
    reason: t.reason,
    domain: t.domain,
    tags: t.tags,
  }));
}

export async function loadWeeklyThemeBySlug(slug: string) {
  return prisma.knowledgeWeeklyTheme.findUnique({ where: { slug } });
}

export async function fetchPublishedFaqs() {
  return prisma.knowledgeFaq.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function fetchPublishedArticles(profile: BriefProfile, ctx: PlanContext, limit = 12) {
  return prisma.knowledgeArticle.findMany({
    where: { published: true, ...ageFilter(0, 216, ctx.ageMonths) },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export async function fetchArticleBySlug(slug: string) {
  return prisma.knowledgeArticle.findFirst({ where: { slug, published: true } });
}

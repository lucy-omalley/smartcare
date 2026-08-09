import type {
  DailyBriefDevelopment,
  DailyBriefPlay,
  DailyBriefRecipe,
  DailyBriefStory,
} from "@/types/daily-brief";
import type {
  ScorableActivity,
  ScorableRecipe,
  ScorableStory,
  ScorableTip,
} from "../types";

export function normalizeItemKey(value: string | undefined | null): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function recipeItemKey(recipe: { subtitle?: string; title?: string; slug?: string }): string {
  return recipe.slug ?? `static:${normalizeItemKey(recipe.subtitle ?? recipe.title ?? "")}`;
}

export function playItemKey(play: { title?: string; slug?: string }): string {
  return play.slug ?? `static:${normalizeItemKey(play.title ?? "")}`;
}

export function storyItemKey(story: { title?: string; slug?: string }): string {
  return story.slug ?? `static:${normalizeItemKey(story.title ?? "")}`;
}

export function tipItemKey(tip: { tryToday?: string; slug?: string }): string {
  return tip.slug ?? `static:${normalizeItemKey(tip.tryToday ?? "")}`;
}

function parsePlayAgeRange(ageRecommendation?: string | null): { minMonths: number; maxMonths: number } {
  const range = ageRecommendation?.match(/(\d+)\s*-\s*(\d+)/);
  if (range) {
    return { minMonths: parseInt(range[1]!, 10) * 12, maxMonths: parseInt(range[2]!, 10) * 12 };
  }
  const single = ageRecommendation?.match(/(\d+)/);
  if (single) {
    const age = parseInt(single[1]!, 10);
    return { minMonths: age * 12, maxMonths: (age + 2) * 12 };
  }
  return { minMonths: 0, maxMonths: 216 };
}

export function briefRecipeToScorable(recipe: DailyBriefRecipe): ScorableRecipe {
  return {
    slug: recipeItemKey(recipe),
    subtitle: recipe.subtitle,
    ingredients: recipe.ingredients ?? [],
    tags: [],
    minAgeMonths: 0,
    maxAgeMonths: 216,
    whyThisMeal: recipe.whyThisMeal ?? null,
    nutritionTags: [],
  };
}

export function briefPlayToScorable(play: DailyBriefPlay): ScorableActivity {
  const { minMonths, maxMonths } = parsePlayAgeRange(play.ageRecommendation);
  const indoorOutdoor = play.indoorOutdoor ?? "either";
  return {
    slug: playItemKey(play),
    title: play.title,
    tags: [],
    minAgeMonths: minMonths,
    maxAgeMonths: maxMonths,
    indoorOutdoor,
    rainyDay: indoorOutdoor === "indoor" || /indoor|rain|fort|yoga|sensory/i.test(play.title),
    sunnyDay: indoorOutdoor === "outdoor" || /outdoor|nature|garden|park/i.test(play.title),
    skillsDeveloped: play.skillsDeveloped ?? [],
    materials: play.materials ?? [],
    reason: play.reason ?? null,
  };
}

export function briefStoryToScorable(story: DailyBriefStory): ScorableStory {
  return {
    slug: storyItemKey(story),
    theme: story.theme ?? "",
    tags: [],
    minAgeMonths: 0,
    maxAgeMonths: 216,
    titleTemplate: story.title,
  };
}

export function briefTipToScorable(tip: DailyBriefDevelopment): ScorableTip {
  return {
    slug: tipItemKey(tip),
    title: tip.domain ?? "Language",
    category: /speech|language/i.test(tip.domain ?? "") ? "SPEECH" : "GENERAL",
    tags: [],
    content: tip.insight ?? "",
    tryToday: tip.tryToday ?? null,
    minAgeMonths: 0,
    maxAgeMonths: 216,
  };
}

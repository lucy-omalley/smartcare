import { KnowledgeTipCategory } from "@prisma/client";
import {
  LANGUAGE_ALTERNATES,
  PLAY_ALTERNATES,
  RECIPE_ALTERNATES,
  storyAlternates,
} from "../../src/lib/services/today-rotate-content";
import { parseAgeRecommendation, slugify, toChildTemplate } from "./utils";

const DEFAULT_CHILD = "your little one";

export function buildRecipesFromRotate() {
  return RECIPE_ALTERNATES.map((r) => ({
    slug: slugify(r.subtitle),
    title: r.title,
    subtitle: r.subtitle,
    minAgeMonths: 12,
    maxAgeMonths: 72,
    prepTimeMinutes: r.prepTimeMinutes ?? 15,
    ingredients: r.ingredients ?? [],
    steps: r.steps ?? [],
    detailedSteps: r.detailedSteps ?? r.steps ?? [],
    nutritionTags: ["Balanced"],
    whyThisMeal: r.whyThisMeal ?? "Recommended because this meal suits young eaters.",
    healthyTip: r.healthyTip ?? undefined,
    tags: ["lunch", "family"],
  }));
}

export function buildActivitiesFromRotate() {
  return PLAY_ALTERNATES.map((a) => {
    const age = parseAgeRecommendation(a.ageRecommendation);
    const indoorOutdoor = a.indoorOutdoor ?? "either";
    return {
      slug: slugify(a.title),
      title: a.title,
      minAgeMonths: age.minAgeMonths,
      maxAgeMonths: age.maxAgeMonths,
      indoorOutdoor,
      rainyDay: indoorOutdoor !== "outdoor",
      sunnyDay: indoorOutdoor !== "indoor",
      durationMinutes: a.durationMinutes ?? 20,
      materials: a.materials ?? [],
      instructions: a.instructions ?? [],
      detailedInstructions: a.detailedInstructions ?? a.instructions ?? [],
      skillsDeveloped: a.skillsDeveloped ?? [],
      tags: ["play", indoorOutdoor],
      reason: a.reason ?? "Recommended because playful activities support development.",
    };
  });
}

export function buildStoriesFromRotate() {
  const stories = storyAlternates({
    childNickname: DEFAULT_CHILD,
    childAge: "2-5 years",
    name: "Parent",
  } as Parameters<typeof storyAlternates>[0]);

  return stories.map((s) => ({
    slug: slugify(s.title.replace(DEFAULT_CHILD, "child")),
    titleTemplate: toChildTemplate(s.title, DEFAULT_CHILD),
    theme: s.theme ?? "Story",
    minAgeMonths: 24,
    maxAgeMonths: 72,
    storyTemplate: toChildTemplate(s.story, DEFAULT_CHILD),
    moral: s.moral ?? undefined,
    lengthMinutes: s.lengthMinutes ?? 4,
    tags: ["bedtime", (s.theme ?? "story").toLowerCase()],
    reason: s.reason ?? undefined,
  }));
}

export function buildTipsFromLanguageAlternates() {
  return LANGUAGE_ALTERNATES.map((l) => ({
    slug: slugify(l.tryToday.slice(0, 60)),
    category: KnowledgeTipCategory.SPEECH,
    minAgeMonths: 12,
    maxAgeMonths: 60,
    title: l.insight.slice(0, 80),
    content: l.insight,
    tryToday: l.tryToday,
    tags: ["language", "speech"],
  }));
}

import type {
  DailyBriefContent,
  DailyBriefDevelopment,
  DailyBriefPlay,
  DailyBriefRecipe,
  DailyBriefStory,
} from "@/types/daily-brief";
import type { BriefProfile } from "@/lib/daily-brief-context";
import {
  LANGUAGE_ALTERNATES,
  PLAY_ALTERNATES,
  RECIPE_ALTERNATES,
  storyAlternates,
} from "@/lib/services/today-rotate-content";
import {
  enrichRotateProfile,
  personalizeLanguage,
  personalizePlay,
  personalizeRecipe,
  personalizeStory,
  rankLanguageForProfile,
  rankPlayForProfile,
  rankRecipesForProfile,
  rankStoriesForProfile,
} from "@/lib/services/today-rotate-profile";

export type RotateSection = "recipe" | "play" | "story" | "language";

export interface RotateLibraryPools {
  recipes?: DailyBriefRecipe[];
  play?: DailyBriefPlay[];
  stories?: DailyBriefStory[];
  language?: DailyBriefDevelopment[];
}

function normalizeKey(value: string | undefined | null): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function sectionSnapshot(
  brief: DailyBriefContent,
  section: RotateSection
): string {
  if (section === "recipe") return brief.recipe.subtitle;
  if (section === "play") return brief.play.title;
  if (section === "story") return brief.bedtimeStory.title;
  const language =
    brief.development.find((d) => /language|speech/i.test(d.domain)) ??
    brief.development[0];
  return language?.tryToday ?? brief.languageSection?.miniGame ?? "";
}

export function getRotationCount(content: DailyBriefContent, section: RotateSection): number {
  return content._rotationCounts?.[section] ?? 0;
}

export function withRotationCount(
  content: DailyBriefContent,
  section: RotateSection
): DailyBriefContent {
  const current = getRotationCount(content, section);
  return {
    ...content,
    _rotationCounts: {
      ...content._rotationCounts,
      [section]: current + 1,
    },
  };
}

/** Merge a rotated section into the current brief without dropping other cards. */
export function applyRotatedSection(
  current: DailyBriefContent,
  updated: DailyBriefContent,
  section: RotateSection
): DailyBriefContent {
  const merged: DailyBriefContent = {
    ...current,
    weeklyFocus: updated.weeklyFocus ?? current.weeklyFocus,
    todayFocus: updated.todayFocus ?? current.todayFocus,
    childAgeDisplay: updated.childAgeDisplay || current.childAgeDisplay,
    greeting: updated.greeting || current.greeting,
    _rotationCounts: updated._rotationCounts ?? current._rotationCounts,
  };

  if (section === "recipe" && updated.recipe?.subtitle) {
    merged.recipe = updated.recipe;
  } else {
    merged.recipe = current.recipe;
  }

  if (section === "play" && updated.play?.title) {
    merged.play = updated.play;
  } else {
    merged.play = current.play;
  }

  if (section === "story" && updated.bedtimeStory?.title) {
    merged.bedtimeStory = updated.bedtimeStory;
  } else {
    merged.bedtimeStory = current.bedtimeStory;
  }

  if (section === "language") {
    merged.development = updated.development?.length ? updated.development : current.development;
    merged.languageSection = updated.languageSection ?? current.languageSection;
  } else {
    merged.development = current.development;
    merged.languageSection = current.languageSection ?? updated.languageSection;
  }

  merged.tip = updated.tip ?? current.tip;
  merged.encouragement = updated.encouragement ?? current.encouragement;
  merged.milestone = updated.milestone ?? current.milestone;
  merged.parentTip = updated.parentTip ?? current.parentTip;

  return merged;
}

export function isSameRecipe(a: DailyBriefRecipe, b: DailyBriefRecipe): boolean {
  return (
    normalizeKey(a.subtitle) === normalizeKey(b.subtitle) ||
    (normalizeKey(a.title) === normalizeKey(b.title) &&
      normalizeKey(a.whyThisMeal) === normalizeKey(b.whyThisMeal))
  );
}

export function isSamePlay(a: DailyBriefPlay, b: DailyBriefPlay): boolean {
  return (
    normalizeKey(a.title) === normalizeKey(b.title) ||
    normalizeKey(a.instructions.join(" ")) === normalizeKey(b.instructions.join(" "))
  );
}

export function isSameStory(a: DailyBriefStory, b: DailyBriefStory): boolean {
  return (
    normalizeKey(a.title) === normalizeKey(b.title) ||
    normalizeKey(a.story).slice(0, 120) === normalizeKey(b.story).slice(0, 120)
  );
}

export function isSameLanguage(a: DailyBriefDevelopment, b: DailyBriefDevelopment): boolean {
  return (
    normalizeKey(a.tryToday) === normalizeKey(b.tryToday) &&
    normalizeKey(a.insight) === normalizeKey(b.insight)
  );
}

function hasNewRecipeContent(raw: Partial<DailyBriefRecipe>): boolean {
  return Boolean(raw.subtitle?.trim() || raw.title?.trim());
}

function hasNewPlayContent(raw: Partial<DailyBriefPlay>): boolean {
  return Boolean(raw.title?.trim());
}

function hasNewStoryContent(raw: Partial<DailyBriefStory>): boolean {
  return Boolean(raw.title?.trim() && raw.story?.trim());
}

function hasNewLanguageContent(raw: Partial<DailyBriefDevelopment>): boolean {
  return Boolean(raw.tryToday?.trim());
}

export function normalizeRotatedRecipe(
  raw: Partial<DailyBriefRecipe>,
  fallback: DailyBriefRecipe
): DailyBriefRecipe {
  if (!hasNewRecipeContent(raw)) {
    return fallback;
  }

  const subtitle = raw.subtitle?.trim() || raw.title?.trim() || fallback.subtitle;
  const title = raw.title?.trim() || subtitle;

  return {
    ...fallback,
    ...raw,
    title,
    subtitle,
    prepTimeMinutes: raw.prepTimeMinutes ?? fallback.prepTimeMinutes,
    whyThisMeal: raw.whyThisMeal?.trim() || fallback.whyThisMeal,
    ingredients: raw.ingredients?.length ? raw.ingredients : fallback.ingredients,
    steps: raw.steps?.length ? raw.steps : fallback.steps,
    imageData: undefined,
    sampleLinks: undefined,
    fromFridge: false,
  };
}

export function normalizeRotatedPlay(raw: Partial<DailyBriefPlay>, fallback: DailyBriefPlay): DailyBriefPlay {
  if (!hasNewPlayContent(raw)) {
    return fallback;
  }

  return {
    ...fallback,
    ...raw,
    title: raw.title?.trim() || fallback.title,
    materials: raw.materials?.length ? raw.materials : fallback.materials,
    instructions: raw.instructions?.length ? raw.instructions : fallback.instructions,
    skillsDeveloped: raw.skillsDeveloped?.length ? raw.skillsDeveloped : fallback.skillsDeveloped,
    durationMinutes: raw.durationMinutes ?? fallback.durationMinutes,
    indoorOutdoor: raw.indoorOutdoor ?? fallback.indoorOutdoor,
    ageRecommendation: raw.ageRecommendation ?? fallback.ageRecommendation,
    reason: raw.reason?.trim() || fallback.reason,
    imageData: undefined,
  };
}

export function normalizeRotatedStory(raw: Partial<DailyBriefStory>, fallback: DailyBriefStory): DailyBriefStory {
  if (!hasNewStoryContent(raw)) {
    return fallback;
  }

  return {
    ...fallback,
    ...raw,
    title: raw.title?.trim() || fallback.title,
    story: raw.story?.trim() || fallback.story,
    theme: raw.theme?.trim() || fallback.theme,
    moral: raw.moral?.trim() || fallback.moral,
    reason: raw.reason?.trim() || fallback.reason,
    ageSuitability: raw.ageSuitability ?? fallback.ageSuitability,
    lengthMinutes: raw.lengthMinutes ?? fallback.lengthMinutes,
    illustrationData: undefined,
  };
}

export function normalizeRotatedLanguage(
  raw: Partial<DailyBriefDevelopment>,
  fallback: DailyBriefDevelopment
): DailyBriefDevelopment {
  if (!hasNewLanguageContent(raw)) {
    return fallback;
  }

  return {
    ...fallback,
    ...raw,
    domain: raw.domain?.trim() || fallback.domain || "Language",
    icon: raw.icon ?? fallback.icon ?? "💬",
    insight: raw.insight?.trim() || fallback.insight,
    tryToday: raw.tryToday?.trim() || fallback.tryToday,
    reason: raw.reason?.trim() || fallback.reason,
  };
}

function dedupeByKey<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = normalizeKey(keyFn(item));
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function mergeRecipePool(
  profile: BriefProfile,
  aiLibrary: DailyBriefRecipe[] = []
): Omit<DailyBriefRecipe, "imageData" | "sampleLinks" | "fromFridge">[] {
  const enriched = enrichRotateProfile(profile);
  const aiRanked = aiLibrary.length ? rankRecipesForProfile(enriched, aiLibrary) : [];
  const staticRanked = rankRecipesForProfile(enriched, RECIPE_ALTERNATES);
  return dedupeByKey([...aiRanked, ...staticRanked], (item) => item.subtitle);
}

function mergePlayPool(profile: BriefProfile, aiLibrary: DailyBriefPlay[] = []): Omit<DailyBriefPlay, "imageData">[] {
  const enriched = enrichRotateProfile(profile);
  const aiRanked = aiLibrary.length ? rankPlayForProfile(enriched, aiLibrary) : [];
  const staticRanked = rankPlayForProfile(enriched, PLAY_ALTERNATES);
  return dedupeByKey([...aiRanked, ...staticRanked], (item) => item.title);
}

function mergeStoryPool(
  profile: BriefProfile,
  aiLibrary: DailyBriefStory[] = []
): Omit<DailyBriefStory, "illustrationData">[] {
  const enriched = enrichRotateProfile(profile);
  const staticStories = storyAlternates(profile);
  const aiRanked = aiLibrary.length ? rankStoriesForProfile(enriched, aiLibrary) : [];
  const staticRanked = rankStoriesForProfile(enriched, staticStories);
  return dedupeByKey([...aiRanked, ...staticRanked], (item) => item.title);
}

function mergeLanguagePool(
  profile: BriefProfile,
  aiLibrary: DailyBriefDevelopment[] = []
): DailyBriefDevelopment[] {
  const enriched = enrichRotateProfile(profile);
  const aiRanked = aiLibrary.length ? rankLanguageForProfile(enriched, aiLibrary) : [];
  const staticRanked = rankLanguageForProfile(enriched, LANGUAGE_ALTERNATES);
  return dedupeByKey([...aiRanked, ...staticRanked], (item) => item.tryToday);
}

function pickFromPool<T extends { title?: string; subtitle?: string }>(
  options: T[],
  current: T,
  key: (item: T) => string,
  rotationIndex: number
): T {
  const currentKey = normalizeKey(key(current));
  const different = options.filter((item) => normalizeKey(key(item)) !== currentKey);
  const pool = different.length > 0 ? different : options;
  return pool[rotationIndex % pool.length]!;
}

export function pickAlternateRecipe(
  profile: BriefProfile,
  current: DailyBriefRecipe,
  rotationIndex: number,
  library?: RotateLibraryPools
): DailyBriefRecipe {
  const pool = mergeRecipePool(profile, library?.recipes);
  const base = pickFromPool(pool, current, (item) => item.subtitle, rotationIndex);
  const personalized = personalizeRecipe(base, enrichRotateProfile(profile));
  return normalizeRotatedRecipe(personalized, current);
}

export function pickAlternatePlay(
  profile: BriefProfile,
  current: DailyBriefPlay,
  rotationIndex: number,
  library?: RotateLibraryPools
): DailyBriefPlay {
  const pool = mergePlayPool(profile, library?.play);
  const base = pickFromPool(pool, current, (item) => item.title, rotationIndex);
  const personalized = personalizePlay(base, enrichRotateProfile(profile));
  return normalizeRotatedPlay(personalized, current);
}

export function pickAlternateStory(
  profile: BriefProfile,
  current: DailyBriefStory,
  rotationIndex: number,
  library?: RotateLibraryPools
): DailyBriefStory {
  const enriched = enrichRotateProfile(profile);
  const options = mergeStoryPool(profile, library?.stories);
  const base = pickFromPool(options, current, (item) => item.title, rotationIndex);
  const personalized = personalizeStory(base, enriched);
  return normalizeRotatedStory(personalized, current);
}

export function pickAlternateLanguage(
  current: DailyBriefDevelopment,
  rotationIndex: number,
  profile?: BriefProfile,
  library?: RotateLibraryPools
): DailyBriefDevelopment {
  const enriched = enrichRotateProfile(profile ?? {});
  const ranked = mergeLanguagePool(profile ?? {}, library?.language);
  const currentKey = normalizeKey(current.tryToday);
  const different = ranked.filter((item) => normalizeKey(item.tryToday) !== currentKey);
  const pool = different.length > 0 ? different : ranked;
  const base = pool[rotationIndex % pool.length]!;
  const personalized = personalizeLanguage(base, enriched);
  return normalizeRotatedLanguage(personalized, current);
}

export function rotateVariationHint(attempt: number): string {
  if (attempt <= 0) return "";
  return `\nCRITICAL: Attempt ${attempt + 1} — choose a completely different theme, format, and main idea. Random token: ${Date.now()}-${attempt}.`;
}

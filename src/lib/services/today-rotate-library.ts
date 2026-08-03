import "server-only";

import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import type { BriefMemory, BriefProfile } from "@/lib/daily-brief-context";
import { enrichProfileWithChildAge } from "@/lib/child-age";
import {
  defaultDailyBrief,
  regenerateLanguage,
  regeneratePlay,
  regenerateRecipe,
  regenerateStory,
  type TodayPlanContext,
} from "@/lib/services/mumbot";
import { buildWeightedRecommendationContext } from "@/lib/services/today-recommendation-engine";
import { fetchWeatherForLocation } from "@/lib/services/weather";
import {
  isSameLanguage,
  isSamePlay,
  isSameRecipe,
  isSameStory,
  normalizeRotatedLanguage,
  normalizeRotatedPlay,
  normalizeRotatedRecipe,
  normalizeRotatedStory,
  type RotateSection,
} from "@/lib/services/today-rotate";
import type {
  DailyBriefDevelopment,
  DailyBriefPlay,
  DailyBriefRecipe,
  DailyBriefStory,
} from "@/types/daily-brief";

export interface RotateLibraryPools {
  recipes: DailyBriefRecipe[];
  play: DailyBriefPlay[];
  stories: DailyBriefStory[];
  language: DailyBriefDevelopment[];
}

const TARGET_LIBRARY_SIZE = 24;
const INITIAL_BATCH_SIZE = 8;
const REFILL_THRESHOLD = 12;
const REFILL_BATCH_SIZE = 6;

const inflightLibraryGeneration = new Map<string, Promise<void>>();
const inflightSectionRefill = new Map<string, Promise<void>>();

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    return `{${entries.map(([k, v]) => `${k}:${stableStringify(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/** Hash profile fields that should trigger a fresh AI library. */
export function computeRotateProfileHash(profile: BriefProfile): string {
  const enriched = enrichProfileWithChildAge(profile) ?? profile;
  const payload = {
    childAge: enriched.childAge,
    childBirthday: enriched.childBirthday,
    childNickname: enriched.childNickname,
    childGender: enriched.childGender,
    childInterests: [...(enriched.childInterests ?? [])].sort(),
    favouriteToys: [...(enriched.favouriteToys ?? [])].sort(),
    favouriteThemes: [...(enriched.favouriteThemes ?? [])].sort(),
    favouriteBooks: [...(enriched.favouriteBooks ?? [])].sort(),
    favouriteFoods: [...(enriched.favouriteFoods ?? [])].sort(),
    foodPreferences: [...(enriched.foodPreferences ?? [])].sort(),
    foodDislikes: [...(enriched.foodDislikes ?? [])].sort(),
    developmentNotes: enriched.developmentNotes,
    parentingGoal: enriched.parentingGoal,
    parentingGoals: [...(enriched.parentingGoals ?? [])].sort(),
    priorityGoal: enriched.priorityGoal,
    currentChallenges: [...(enriched.currentChallenges ?? [])].sort(),
    personality: enriched.personality,
    homeLanguage: enriched.homeLanguage,
    sleepRoutine: enriched.sleepRoutine,
  };
  return createHash("sha256").update(stableStringify(payload)).digest("hex").slice(0, 16);
}

function parseLibraryRecord(record: {
  recipes: unknown;
  play: unknown;
  stories: unknown;
  language: unknown;
}): RotateLibraryPools {
  return {
    recipes: Array.isArray(record.recipes) ? (record.recipes as DailyBriefRecipe[]) : [],
    play: Array.isArray(record.play) ? (record.play as DailyBriefPlay[]) : [],
    stories: Array.isArray(record.stories) ? (record.stories as DailyBriefStory[]) : [],
    language: Array.isArray(record.language) ? (record.language as DailyBriefDevelopment[]) : [],
  };
}

function emptyLibrary(): RotateLibraryPools {
  return { recipes: [], play: [], stories: [], language: [] };
}

function isValidRecipe(item: DailyBriefRecipe): boolean {
  return Boolean(item.subtitle?.trim() && item.ingredients?.length && item.steps?.length);
}

function isValidPlay(item: DailyBriefPlay): boolean {
  return Boolean(item.title?.trim() && item.instructions?.length);
}

function isValidStory(item: DailyBriefStory): boolean {
  return Boolean(item.title?.trim() && item.story?.trim());
}

function isValidLanguage(item: DailyBriefDevelopment): boolean {
  return Boolean(item.tryToday?.trim() && item.insight?.trim());
}

async function buildLibraryPlanContext(
  profile: BriefProfile,
  memories: BriefMemory[],
  memorySignals: Awaited<
    ReturnType<typeof import("@/lib/services/today-recommendation-engine").gatherAIMemorySignals>
  >
): Promise<TodayPlanContext> {
  const weeklyFocus = {
    title: profile.weeklyFocusTitle ?? "Building Connection",
    reason: "Personalised suggestions for your child this week.",
  };
  const weather = profile.location ? await fetchWeatherForLocation(profile.location) : null;
  return {
    weightedContext: buildWeightedRecommendationContext(
      profile,
      memories,
      [],
      weeklyFocus,
      memorySignals,
      weather?.weather ?? null
    ),
    weeklyFocus,
  };
}

async function generateRecipeItems(
  profile: BriefProfile,
  memories: BriefMemory[],
  planContext: TodayPlanContext,
  existing: DailyBriefRecipe[],
  count: number
): Promise<DailyBriefRecipe[]> {
  const fallback = defaultDailyBrief(profile).recipe;
  const added: DailyBriefRecipe[] = [];
  let avoid = existing[existing.length - 1];

  for (let attempt = 0; attempt < count * 2 && added.length < count; attempt++) {
    try {
      const raw = await regenerateRecipe(profile, memories, avoid, planContext, attempt % 3);
      const item = normalizeRotatedRecipe(raw, fallback);
      if (!isValidRecipe(item)) continue;
      if (existing.some((entry) => isSameRecipe(entry, item))) continue;
      if (added.some((entry) => isSameRecipe(entry, item))) continue;
      added.push({
        ...item,
        imageData: undefined,
        sampleLinks: undefined,
        fromFridge: false,
      });
      avoid = item;
    } catch (error) {
      console.warn("AI recipe library item failed:", error);
    }
  }

  return added;
}

async function generatePlayItems(
  profile: BriefProfile,
  memories: BriefMemory[],
  planContext: TodayPlanContext,
  existing: DailyBriefPlay[],
  count: number
): Promise<DailyBriefPlay[]> {
  const fallback = defaultDailyBrief(profile).play;
  const weather = profile.location ? await fetchWeatherForLocation(profile.location) : null;
  const added: DailyBriefPlay[] = [];
  let avoid = existing[existing.length - 1];

  for (let attempt = 0; attempt < count * 2 && added.length < count; attempt++) {
    try {
      const raw = await regeneratePlay(
        profile,
        memories,
        avoid,
        weather?.weather ?? null,
        planContext,
        attempt % 3
      );
      const item = normalizeRotatedPlay(raw, fallback);
      if (!isValidPlay(item)) continue;
      if (existing.some((entry) => isSamePlay(entry, item))) continue;
      if (added.some((entry) => isSamePlay(entry, item))) continue;
      added.push({ ...item, imageData: undefined });
      avoid = item;
    } catch (error) {
      console.warn("AI play library item failed:", error);
    }
  }

  return added;
}

async function generateStoryItems(
  profile: BriefProfile,
  memories: BriefMemory[],
  planContext: TodayPlanContext,
  existing: DailyBriefStory[],
  count: number
): Promise<DailyBriefStory[]> {
  const fallback = defaultDailyBrief(profile).bedtimeStory;
  const added: DailyBriefStory[] = [];
  let avoid = existing[existing.length - 1];

  for (let attempt = 0; attempt < count * 2 && added.length < count; attempt++) {
    try {
      const raw = await regenerateStory(profile, memories, avoid, planContext, attempt % 3);
      const item = normalizeRotatedStory(raw, fallback);
      if (!isValidStory(item)) continue;
      if (existing.some((entry) => isSameStory(entry, item))) continue;
      if (added.some((entry) => isSameStory(entry, item))) continue;
      added.push({ ...item, illustrationData: undefined });
      avoid = item;
    } catch (error) {
      console.warn("AI story library item failed:", error);
    }
  }

  return added;
}

async function generateLanguageItems(
  profile: BriefProfile,
  memories: BriefMemory[],
  planContext: TodayPlanContext,
  existing: DailyBriefDevelopment[],
  count: number
): Promise<DailyBriefDevelopment[]> {
  const fallback = defaultDailyBrief(profile).development[0]!;
  const added: DailyBriefDevelopment[] = [];
  let avoid = existing[existing.length - 1];

  for (let attempt = 0; attempt < count * 2 && added.length < count; attempt++) {
    try {
      const raw = await regenerateLanguage(profile, memories, avoid, planContext, attempt % 3);
      const item = normalizeRotatedLanguage(raw, fallback);
      if (!isValidLanguage(item)) continue;
      if (existing.some((entry) => isSameLanguage(entry, item))) continue;
      if (added.some((entry) => isSameLanguage(entry, item))) continue;
      added.push(item);
      avoid = item;
    } catch (error) {
      console.warn("AI language library item failed:", error);
    }
  }

  return added;
}

async function generateSectionItems(
  section: RotateSection,
  profile: BriefProfile,
  memories: BriefMemory[],
  planContext: TodayPlanContext,
  existing: RotateLibraryPools,
  count: number
): Promise<Partial<RotateLibraryPools>> {
  switch (section) {
    case "recipe":
      return { recipes: await generateRecipeItems(profile, memories, planContext, existing.recipes, count) };
    case "play":
      return { play: await generatePlayItems(profile, memories, planContext, existing.play, count) };
    case "story":
      return { stories: await generateStoryItems(profile, memories, planContext, existing.stories, count) };
    case "language":
      return { language: await generateLanguageItems(profile, memories, planContext, existing.language, count) };
  }
}

function mergeLibraryPools(current: RotateLibraryPools, patch: Partial<RotateLibraryPools>): RotateLibraryPools {
  return {
    recipes: [...current.recipes, ...(patch.recipes ?? [])].slice(-TARGET_LIBRARY_SIZE),
    play: [...current.play, ...(patch.play ?? [])].slice(-TARGET_LIBRARY_SIZE),
    stories: [...current.stories, ...(patch.stories ?? [])].slice(-TARGET_LIBRARY_SIZE),
    language: [...current.language, ...(patch.language ?? [])].slice(-TARGET_LIBRARY_SIZE),
  };
}

async function persistLibrary(userId: string, profileHash: string, pools: RotateLibraryPools): Promise<void> {
  await prisma.userRotateLibrary.upsert({
    where: { userId },
    create: {
      userId,
      profileHash,
      recipes: pools.recipes as object[],
      play: pools.play as object[],
      stories: pools.stories as object[],
      language: pools.language as object[],
    },
    update: {
      profileHash,
      recipes: pools.recipes as object[],
      play: pools.play as object[],
      stories: pools.stories as object[],
      language: pools.language as object[],
    },
  });
}

export async function getRotateLibraryPools(userId: string, profile: BriefProfile): Promise<RotateLibraryPools> {
  const profileHash = computeRotateProfileHash(profile);
  const record = await prisma.userRotateLibrary.findUnique({ where: { userId } }).catch(() => null);

  if (!record || record.profileHash !== profileHash) {
    return emptyLibrary();
  }

  return parseLibraryRecord(record);
}

export async function invalidateRotateLibrary(userId: string): Promise<void> {
  await prisma.userRotateLibrary.deleteMany({ where: { userId } }).catch(() => {});
}

async function generateInitialLibrary(userId: string): Promise<void> {
  const { fetchRotateContext } = await import("@/lib/services/daily-brief");
  const { profile, memories, memorySignals } = await fetchRotateContext(userId);
  const profileHash = computeRotateProfileHash(profile);
  const planContext = await buildLibraryPlanContext(profile, memories, memorySignals);

  const sections: RotateSection[] = ["recipe", "play", "story", "language"];
  let pools = emptyLibrary();

  for (const section of sections) {
    const patch = await generateSectionItems(
      section,
      profile,
      memories,
      planContext,
      pools,
      INITIAL_BATCH_SIZE
    );
    pools = mergeLibraryPools(pools, patch);
  }

  if (
    pools.recipes.length +
      pools.play.length +
      pools.stories.length +
      pools.language.length ===
    0
  ) {
    return;
  }

  await persistLibrary(userId, profileHash, pools);
}

async function refillLibrarySection(userId: string, section: RotateSection): Promise<void> {
  const key = `${userId}:${section}`;
  if (inflightSectionRefill.has(key)) return inflightSectionRefill.get(key)!;

  const task = (async () => {
    const { fetchRotateContext } = await import("@/lib/services/daily-brief");
    const { profile, memories, memorySignals } = await fetchRotateContext(userId);
    const profileHash = computeRotateProfileHash(profile);
    const record = await prisma.userRotateLibrary.findUnique({ where: { userId } });
    const current =
      record && record.profileHash === profileHash ? parseLibraryRecord(record) : emptyLibrary();

    const sectionCount = {
      recipe: current.recipes.length,
      play: current.play.length,
      story: current.stories.length,
      language: current.language.length,
    }[section];

    if (sectionCount >= TARGET_LIBRARY_SIZE) return;

    const planContext = await buildLibraryPlanContext(profile, memories, memorySignals);
    const patch = await generateSectionItems(
      section,
      profile,
      memories,
      planContext,
      current,
      REFILL_BATCH_SIZE
    );
    const merged = mergeLibraryPools(current, patch);
    if (JSON.stringify(merged) === JSON.stringify(current)) return;
    await persistLibrary(userId, profileHash, merged);
  })().finally(() => {
    inflightSectionRefill.delete(key);
  });

  inflightSectionRefill.set(key, task);
  return task;
}

/** Build or refresh the per-user AI rotate library in the background. */
export async function ensureRotateLibrary(userId: string): Promise<void> {
  const { fetchRotateContext } = await import("@/lib/services/daily-brief");
  const { profile } = await fetchRotateContext(userId);
  const profileHash = computeRotateProfileHash(profile);
  const record = await prisma.userRotateLibrary.findUnique({ where: { userId } }).catch(() => null);

  if (!record || record.profileHash !== profileHash) {
    await generateInitialLibrary(userId);
    return;
  }

  const pools = parseLibraryRecord(record);
  const sections: RotateSection[] = ["recipe", "play", "story", "language"];
  for (const section of sections) {
    const count = {
      recipe: pools.recipes.length,
      play: pools.play.length,
      story: pools.stories.length,
      language: pools.language.length,
    }[section];
    if (count < REFILL_THRESHOLD) {
      await refillLibrarySection(userId, section);
    }
  }
}

export function warmRotateLibraryInBackground(userId: string): void {
  if (inflightLibraryGeneration.has(userId)) return;

  const task = ensureRotateLibrary(userId)
    .catch((error) => console.warn("Background rotate library warm failed:", error))
    .finally(() => {
      inflightLibraryGeneration.delete(userId);
    });

  inflightLibraryGeneration.set(userId, task);
}

export function scheduleRotateLibraryRefill(userId: string, section: RotateSection): void {
  void refillLibrarySection(userId, section).catch((error) => {
    console.warn(`Rotate library refill for ${section} failed:`, error);
  });
}

export function getLibraryPoolSize(pools: RotateLibraryPools, section: RotateSection): number {
  switch (section) {
    case "recipe":
      return pools.recipes.length;
    case "play":
      return pools.play.length;
    case "story":
      return pools.stories.length;
    case "language":
      return pools.language.length;
  }
}

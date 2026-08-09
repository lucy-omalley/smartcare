import { prisma } from "@/lib/db";
import {
  defaultDailyBrief,
  type TodayPlanContext,
} from "@/lib/services/mumbot";
import { buildPersonalizedDailyBrief } from "@/lib/services/today-plan-engine";
import { assertCanGenerateTodayPlan, recordTodayPlanGenerated, logAIRequest } from "@/lib/ai/usage";
import { fetchWeatherForLocation } from "@/lib/services/weather";
import { toDateKey, yesterdayDateKey } from "@/lib/date-utils";
import type {
  DailyBriefContent,
  DailyBriefPlay,
  DailyBriefRecipe,
  DailyBriefStory,
  DailyBriefDevelopment,
  DailyBriefLanguageSection,
} from "@/types/daily-brief";
import { enrichBriefWithIllustrations, needsBriefIllustrations, type IllustrationSection } from "@/lib/services/card-illustrations";
import type { BriefProfile } from "@/lib/daily-brief-context";
import { clearTodayStoryAudio, warmTodayStoryAudio } from "@/lib/services/story-audio-cache";
import {
  buildWeightedRecommendationContext,
  gatherAIMemorySignals,
  getOrCreateWeeklyFocus,
  getWeeklyFocusFast,
  refreshWeeklyFocus,
} from "@/lib/services/today-recommendation-engine";
import { normalizeBriefContent, isValidBriefContent, repairBriefContent } from "@/lib/today-plan-utils";
import {
  isSameLanguage,
  isSamePlay,
  isSameRecipe,
  isSameStory,
  pickAlternatePlay,
  pickAlternateRecipe,
  pickAlternateStory,
  pickAlternateLanguage,
  getRotationCount,
  withRotationCount,
  sectionSnapshot,
  type RotateSection,
  type RotateLibraryPools,
} from "@/lib/services/today-rotate";
import {
  getRotateLibraryPools,
  invalidateRotateLibrary,
  scheduleRotateLibraryRefill,
  warmRotateLibraryInBackground,
} from "@/lib/services/today-rotate-library";
import { buildPlanContext as buildKnowledgePlanContext } from "@/lib/knowledge/repository";
import { buildPlanSignalsForUser } from "@/lib/intelligence/context/build-plan-signals-for-user";
import type { PlanSignals } from "@/lib/intelligence/types";
import {
  playItemKey,
  recipeItemKey,
  storyItemKey,
} from "@/lib/intelligence/adapters/brief-to-scorable";
import { enrichProfileWithChildAge } from "@/lib/child-age";

export { needsBriefIllustrations };
export { warmTodayStoryAudio };

const inflightBriefGeneration = new Map<string, Promise<DailyBriefContent>>();

/** Return today's cached brief from DB only — no AI generation. */
export async function getCachedDailyBrief(userId: string): Promise<DailyBriefContent | null> {
  const cached = await getCachedDailyBriefWithMeta(userId);
  return cached?.brief ?? null;
}

export async function getCachedDailyBriefWithMeta(userId: string) {
  const today = toDateKey();
  const existing = await prisma.dailyBrief.findUnique({
    where: { userId_date: { userId, date: today } },
    select: { content: true, updatedAt: true },
  });
  if (!existing) return null;

  const normalized = normalizeBriefContent(existing.content as unknown as DailyBriefContent);
  if (!isValidBriefContent(normalized)) {
    const defaults = await loadDefaultBriefForUser(userId);
    const repaired = repairBriefContent(normalized, defaults);
    await prisma.dailyBrief.update({
      where: { userId_date: { userId, date: today } },
      data: { content: repaired as object },
    }).catch(() => {});
    return {
      brief: repaired,
      updatedAt: existing.updatedAt,
    };
  }

  return {
    brief: normalized,
    updatedAt: existing.updatedAt,
  };
}

/** Start AI generation once per user if today's brief is missing. */
export function ensureTodayPlanGenerating(userId: string): void {
  warmRotateLibraryInBackground(userId);
  if (inflightBriefGeneration.has(userId)) return;

  const task = getOrCreateDailyBrief(userId)
    .catch((err) => {
      console.warn("Background today plan generation failed:", err);
      throw err;
    })
    .finally(() => {
      inflightBriefGeneration.delete(userId);
    });

  inflightBriefGeneration.set(userId, task);
}

export { getWeeklyFocusFast };

function warmWeeklyFocusInBackground(
  userId: string,
  profile: BriefProfile,
  memories: { content: string; category: import("@prisma/client").MemoryCategory }[],
  memorySignals: Awaited<ReturnType<typeof gatherAIMemorySignals>>
): void {
  void getOrCreateWeeklyFocus(userId, profile, memories, memorySignals).catch(
    (err) => console.warn("Background weekly focus generation failed:", err)
  );
}

const LEGACY_PROFILE_SELECT = {
  name: true,
  childNickname: true,
  childAge: true,
  childBirthday: true,
  childInterests: true,
  foodPreferences: true,
  routineNotes: true,
  developmentNotes: true,
  parentingGoal: true,
  parentingGoals: true,
  priorityGoal: true,
  currentChallenges: true,
  location: true,
  broadArea: true,
} as const;

async function fetchUserProfile(userId: string): Promise<BriefProfile> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: PROFILE_SELECT });
    return (enrichProfileWithChildAge(user) ?? {}) as BriefProfile;
  } catch (error) {
    console.warn("Extended profile fetch failed, using legacy fields:", error);
    const user = await prisma.user.findUnique({ where: { id: userId }, select: LEGACY_PROFILE_SELECT });
    return (enrichProfileWithChildAge(user) ?? {}) as BriefProfile;
  }
}

async function safeMemorySignals(userId: string) {
  try {
    return await gatherAIMemorySignals(userId);
  } catch (error) {
    console.warn("AI memory signals fetch failed:", error);
    return {
      completedStories: [],
      completedActivities: [],
      savedMeals: [],
      favouriteTopics: [],
      skippedRecommendations: [],
      recentMumbotTopics: [],
    };
  }
}

const PROFILE_SELECT = {
  name: true,
  childNickname: true,
  childAge: true,
  childBirthday: true,
  childGender: true,
  childInterests: true,
  favouriteToys: true,
  favouriteThemes: true,
  favouriteBooks: true,
  favouriteFoods: true,
  foodDislikes: true,
  sleepRoutine: true,
  schoolNursery: true,
  personality: true,
  homeLanguage: true,
  foodPreferences: true,
  routineNotes: true,
  developmentNotes: true,
  parentingGoal: true,
  parentingGoals: true,
  priorityGoal: true,
  currentChallenges: true,
  location: true,
  broadArea: true,
  weeklyFocusTitle: true,
} as const;

export async function generateAndSaveBriefIllustrations(
  userId: string,
  sections?: IllustrationSection[]
): Promise<DailyBriefContent> {
  const today = toDateKey();
  let brief = await prisma.dailyBrief.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  if (!brief) {
    return getOrCreateDailyBrief(userId);
  }

  const content = normalizeBriefContent(brief.content as unknown as DailyBriefContent);
  if (!sections?.length && !needsBriefIllustrations(content)) {
    return content;
  }

  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: { childNickname: true },
  });

  const enriched = await enrichBriefWithIllustrations(
    content,
    profile?.childNickname,
    sections?.length ? sections : undefined
  );
  await prisma.dailyBrief.update({
    where: { userId_date: { userId, date: today } },
    data: { content: enriched as object },
  });

  return enriched;
}

async function fetchBriefContext(userId: string) {
  const [profile, memories, memorySignals] = await Promise.all([
    fetchUserProfile(userId),
    prisma.familyMemory.findMany({
      where: { userId },
      select: { content: true, category: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    safeMemorySignals(userId),
  ]);

  const { focus: weeklyFocus, needsAi: weeklyFocusNeedsAi } = await getWeeklyFocusFast(userId);
  if (weeklyFocusNeedsAi) {
    warmWeeklyFocusInBackground(userId, profile, memories, memorySignals);
  }

  return {
    profile,
    memories,
    recentMessages: [] as string[],
    weeklyFocus,
    memorySignals,
  };
}

async function buildPlanContext(
  userId: string,
  profile: BriefProfile,
  memories: { content: string; category: import("@prisma/client").MemoryCategory }[],
  recentMessages: string[],
  weeklyFocus: { title: string; reason: string },
  memorySignals: Awaited<ReturnType<typeof gatherAIMemorySignals>>,
  weather?: import("@/types/daily-brief").WeatherInfo | null,
  todayFocus?: { title: string; reason: string }
): Promise<TodayPlanContext> {
  return {
    weightedContext: buildWeightedRecommendationContext(
      profile,
      memories,
      recentMessages,
      weeklyFocus,
      memorySignals,
      weather ?? null
    ),
    weeklyFocus,
    todayFocus,
  };
}

/** Lighter profile + memories fetch for Try another — skips chat history. */
export async function fetchRotateContext(userId: string) {
  const [profile, memories, memorySignals] = await Promise.all([
    fetchUserProfile(userId),
    prisma.familyMemory.findMany({
      where: { userId },
      select: { content: true, category: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    safeMemorySignals(userId),
  ]);

  let weeklyFocus = {
    title: "Building Connection",
    reason: "Small moments of presence strengthen your bond this week.",
  };
  try {
    const result = await getWeeklyFocusFast(userId);
    weeklyFocus = result.focus;
    if (result.needsAi) {
      warmWeeklyFocusInBackground(userId, profile, memories, memorySignals);
    }
  } catch (error) {
    console.warn("Weekly focus setup failed:", error);
  }

  return {
    profile,
    memories,
    weeklyFocus,
    memorySignals,
  };
}

export async function invalidateTodayPlan(userId: string): Promise<void> {
  const today = toDateKey();
  await prisma.dailyBrief.deleteMany({
    where: { userId, date: today },
  });
  await clearTodayStoryAudio(userId);
  await invalidateRotateLibrary(userId);
}

/** Regenerate today's plan in the background after profile changes. */
export function warmTodayPlanInBackground(userId: string): void {
  warmRotateLibraryInBackground(userId);
  void getOrCreateDailyBrief(userId).catch((err) => {
    console.warn("Background today plan regeneration failed:", err);
  });
}

export async function getOrCreateDailyBrief(userId: string): Promise<DailyBriefContent> {
  const today = toDateKey();

  const existing = await prisma.dailyBrief.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  if (existing) {
    const normalized = normalizeBriefContent(existing.content as unknown as DailyBriefContent);
    if (isValidBriefContent(normalized)) {
      return normalized;
    }
    console.warn("Stored daily brief invalid, regenerating for user:", userId);
  }

  const { profile, memories, recentMessages, weeklyFocus, memorySignals } =
    await fetchBriefContext(userId);
  const weather = profile.location ? await fetchWeatherForLocation(profile.location) : null;

  let content: DailyBriefContent;
  try {
    await assertCanGenerateTodayPlan(userId);
    content = await buildPersonalizedDailyBrief({
      userId,
      profile,
      weather: weather?.weather ?? null,
      weeklyFocus,
      memorySignals,
    });
    if (!isValidBriefContent(content)) {
      throw new Error("Personalized brief missing required sections");
    }
    await recordTodayPlanGenerated(userId);
  } catch (error) {
    if (error instanceof Error && error.name === "UsageLimitError") throw error;
    console.error("Daily brief generation failed, using fallback:", error);
    await logAIRequest({ userId, feature: "TODAY_PLAN", resolution: "DB_ONLY" });
    content = normalizeBriefContent(defaultDailyBrief(profile, weeklyFocus));
  }

  try {
    await prisma.dailyBrief.create({
      data: { userId, date: today, content: content as object },
    });
    warmTodayStoryAudio(userId);
    warmRotateLibraryInBackground(userId);
  } catch (error) {
    console.error("Failed to persist daily brief:", error);
  }

  return content;
}

export async function refreshUserWeeklyFocus(userId: string) {
  const { profile, memories, memorySignals } = await fetchRotateContext(userId);
  return refreshWeeklyFocus(userId, profile, memories, memorySignals);
}

function developmentToLanguageSection(lang: DailyBriefDevelopment): DailyBriefLanguageSection {
  return {
    words: lang.tryToday.split(/[,;]/).map((w) => w.trim()).filter(Boolean).slice(0, 6),
    conversationStarters: [lang.insight],
    miniGame: lang.tryToday,
    reason: lang.reason ?? "Recommended because speech practice fits today's focus.",
    domain: lang.domain,
    icon: lang.icon ?? "💬",
  };
}

export async function updateDailyBriefSection(
  userId: string,
  section: "recipe" | "play" | "story" | "language",
  value: DailyBriefRecipe | DailyBriefPlay | DailyBriefStory | DailyBriefDevelopment
) {
  const today = toDateKey();
  await ensureTodayBriefRecord(userId);

  const brief = await prisma.dailyBrief.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  const defaults = await loadDefaultBriefForUser(userId);
  const baseContent = repairBriefContent(
    normalizeBriefContent(brief!.content as unknown as DailyBriefContent),
    defaults
  );

  let content = withRotationCount(baseContent, section);
  if (section === "recipe") content.recipe = value as DailyBriefRecipe;
  if (section === "play") content.play = value as DailyBriefPlay;
  if (section === "story") {
    content.bedtimeStory = value as DailyBriefStory;
    delete content.bedtimeStory.illustrationData;
    await clearTodayStoryAudio(userId);
  }
  if (section === "language") {
    const lang = value as DailyBriefDevelopment;
    content.languageSection = developmentToLanguageSection(lang);
    const idx = content.development.findIndex((d) => /language|speech/i.test(d.domain));
    if (idx >= 0) content.development[idx] = lang;
    else content.development.unshift(lang);
  }

  content = repairBriefContent(normalizeBriefContent(content), defaults);

  await prisma.dailyBrief.update({
    where: { userId_date: { userId, date: today } },
    data: { content: content as object },
  });

  const fresh = await prisma.dailyBrief.findUnique({
    where: { userId_date: { userId, date: today } },
    select: { content: true, updatedAt: true },
  });

  const saved = repairBriefContent(
    normalizeBriefContent(fresh!.content as unknown as DailyBriefContent),
    defaults
  );

  return {
    brief: saved,
    updatedAt: fresh!.updatedAt,
  };
}

async function loadDefaultBriefForUser(userId: string): Promise<DailyBriefContent> {
  const [profile, weeklyFocusResult] = await Promise.all([
    fetchRotateProfile(userId),
    getWeeklyFocusFast(userId),
  ]);
  return normalizeBriefContent(defaultDailyBrief(profile, weeklyFocusResult.focus));
}

async function ensureTodayBriefRecord(userId: string) {
  const today = toDateKey();
  let brief = await prisma.dailyBrief.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  const defaults = await loadDefaultBriefForUser(userId);

  if (brief) {
    const content = repairBriefContent(
      normalizeBriefContent(brief.content as unknown as DailyBriefContent),
      defaults
    );
    if (!isValidBriefContent(normalizeBriefContent(brief.content as unknown as DailyBriefContent))) {
      await prisma.dailyBrief.update({
        where: { userId_date: { userId, date: today } },
        data: { content: content as object },
      });
    }
    return brief;
  }

  try {
    await prisma.dailyBrief.create({
      data: { userId, date: today, content: defaults as object },
    });
  } catch {
    // Another request created today's brief first.
  }

  brief = await prisma.dailyBrief.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  if (!brief) {
    throw new Error("Today's plan is still loading. Please try again in a moment.");
  }

  return brief;
}

const ROTATE_PROFILE_SELECT = {
  name: true,
  childNickname: true,
  childAge: true,
  childBirthday: true,
  childGender: true,
  childInterests: true,
  favouriteToys: true,
  favouriteThemes: true,
  favouriteBooks: true,
  favouriteFoods: true,
  foodPreferences: true,
  foodDislikes: true,
  sleepRoutine: true,
  personality: true,
  homeLanguage: true,
  developmentNotes: true,
  parentingGoal: true,
  parentingGoals: true,
  priorityGoal: true,
  currentChallenges: true,
  weeklyFocusTitle: true,
} as const;

async function fetchRotateProfile(userId: string): Promise<BriefProfile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: ROTATE_PROFILE_SELECT,
  });
  return enrichProfileWithChildAge((user ?? {}) as BriefProfile) ?? ({} as BriefProfile);
}

function pickNextRecipe(
  current: DailyBriefRecipe,
  profile: BriefProfile,
  rotationIndex: number,
  library: RotateLibraryPools | undefined,
  signals: PlanSignals
): DailyBriefRecipe {
  for (let i = rotationIndex; i < rotationIndex + 40; i++) {
    const candidate = pickAlternateRecipe(profile, current, i, library, signals);
    if (!isSameRecipe(candidate, current)) return candidate;
  }
  return pickAlternateRecipe(profile, current, rotationIndex + 1, library, signals);
}

function pickNextPlay(
  current: DailyBriefPlay,
  profile: BriefProfile,
  rotationIndex: number,
  library: RotateLibraryPools | undefined,
  signals: PlanSignals
): DailyBriefPlay {
  for (let i = rotationIndex; i < rotationIndex + 40; i++) {
    const candidate = pickAlternatePlay(profile, current, i, library, signals);
    if (!isSamePlay(candidate, current)) return candidate;
  }
  return pickAlternatePlay(profile, current, rotationIndex + 1, library, signals);
}

function pickNextStory(
  current: DailyBriefStory,
  profile: BriefProfile,
  rotationIndex: number,
  library: RotateLibraryPools | undefined,
  signals: PlanSignals
): DailyBriefStory {
  for (let i = rotationIndex; i < rotationIndex + 40; i++) {
    const candidate = pickAlternateStory(profile, current, i, library, signals);
    if (!isSameStory(candidate, current)) return candidate;
  }
  return pickAlternateStory(profile, current, rotationIndex + 1, library, signals);
}

function pickNextLanguage(
  current: DailyBriefDevelopment,
  rotationIndex: number,
  profile: BriefProfile,
  library: RotateLibraryPools | undefined,
  signals: PlanSignals
): DailyBriefDevelopment {
  for (let i = rotationIndex; i < rotationIndex + 40; i++) {
    const candidate = pickAlternateLanguage(current, i, profile, library, signals);
    if (!isSameLanguage(candidate, current)) return candidate;
  }
  return pickAlternateLanguage(current, rotationIndex + 1, profile, library, signals);
}

async function buildRotateSignals(
  userId: string,
  profile: BriefProfile,
  content: DailyBriefContent
): Promise<PlanSignals> {
  const { memorySignals } = await fetchRotateContext(userId);
  const weatherResult = profile.location ? await fetchWeatherForLocation(profile.location) : null;
  const ctx = buildKnowledgePlanContext(profile, weatherResult?.weather ?? null);
  return buildPlanSignalsForUser({
    userId,
    profile,
    ctx,
    memory: memorySignals,
    history: {
      previousRecipeSlugs: [recipeItemKey(content.recipe)],
      previousActivitySlugs: [playItemKey(content.play)],
      previousStorySlugs: [storyItemKey(content.bedtimeStory)],
    },
  });
}

/** Fast Try another — uses AI library + curated fallback, no blocking AI wait. */
export async function regenerateDailyBriefSection(
  userId: string,
  section: RotateSection
) {
  const brief = await ensureTodayBriefRecord(userId);
  const content = normalizeBriefContent(brief.content as unknown as DailyBriefContent);
  const beforeSnapshot = sectionSnapshot(content, section);
  const rotationIndex = getRotationCount(content, section) + 1;
  const profile = await fetchRotateProfile(userId);
  const library = await getRotateLibraryPools(userId, profile);
  const signals = await buildRotateSignals(userId, profile, content);
  warmRotateLibraryInBackground(userId);

  if (section === "recipe") {
    const recipe = pickNextRecipe(content.recipe, profile, rotationIndex, library, signals);
    delete recipe.imageData;
    const saved = await updateDailyBriefSection(userId, "recipe", recipe);
    scheduleRotateLibraryRefill(userId, section);
    return {
      ...saved,
      changed: sectionSnapshot(saved.brief, section) !== beforeSnapshot,
    };
  }

  if (section === "play") {
    const play = pickNextPlay(content.play, profile, rotationIndex, library, signals);
    delete play.imageData;
    const saved = await updateDailyBriefSection(userId, "play", play);
    scheduleRotateLibraryRefill(userId, section);
    return {
      ...saved,
      changed: sectionSnapshot(saved.brief, section) !== beforeSnapshot,
    };
  }

  if (section === "story") {
    const story = pickNextStory(content.bedtimeStory, profile, rotationIndex, library, signals);
    delete story.illustrationData;
    const saved = await updateDailyBriefSection(userId, "story", story);
    scheduleRotateLibraryRefill(userId, section);
    return {
      ...saved,
      changed: sectionSnapshot(saved.brief, section) !== beforeSnapshot,
    };
  }

  const languageItem =
    content.development.find((d) => /language|speech/i.test(d.domain)) ??
    content.development[0];
  const language = pickNextLanguage(languageItem, rotationIndex, profile, library, signals);
  const saved = await updateDailyBriefSection(userId, "language", language);
  scheduleRotateLibraryRefill(userId, section);
  return {
    ...saved,
    changed: sectionSnapshot(saved.brief, section) !== beforeSnapshot,
  };
}

export async function getYesterdayJournalMemory(userId: string) {
  const yesterday = yesterdayDateKey();
  const tomorrow = toDateKey(new Date(yesterday.getTime() + 86400000));

  return prisma.familyMemory.findFirst({
    where: {
      userId,
      category: "JOURNAL",
      createdAt: { gte: yesterday, lt: tomorrow },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, content: true, createdAt: true },
  });
}

export async function getHomeSupplementaryData(userId: string) {
  const now = new Date();
  const weekendStart = new Date(now);
  const day = now.getDay();
  const daysUntilSaturday = (6 - day + 7) % 7 || 7;
  weekendStart.setDate(now.getDate() + (day === 0 ? 0 : daysUntilSaturday));
  weekendStart.setHours(0, 0, 0, 0);

  const [meetups, weekendActivities, profile, yesterdayMemory, weatherResult] = await Promise.all([
    prisma.meetup.findMany({
      where: { date: { gte: now } },
      orderBy: { date: "asc" },
      take: 3,
      select: { id: true, title: true, date: true, time: true, location: true, childAgeRange: true },
    }),
    prisma.activity.findMany({
      where: { date: { gte: weekendStart } },
      orderBy: { date: "asc" },
      take: 4,
      select: { id: true, title: true, description: true, category: true, date: true, location: true },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: PROFILE_SELECT }),
    getYesterdayJournalMemory(userId),
    prisma.user
      .findUnique({ where: { id: userId }, select: { location: true } })
      .then((u) => (u?.location ? fetchWeatherForLocation(u.location) : { weather: null })),
  ]);

  const { weather, error: weatherError } = weatherResult;

  return { meetups, weekendActivities, profile, yesterdayMemory, weather, weatherError };
}

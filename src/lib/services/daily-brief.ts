import { prisma } from "@/lib/db";
import {
  defaultDailyBrief,
  generateDailyBrief,
  generateWeeklyFocus,
  regeneratePlay,
  regenerateRecipe,
  regenerateStory,
  regenerateLanguage,
  type TodayPlanContext,
} from "@/lib/services/mumbot";
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
  refreshWeeklyFocus,
} from "@/lib/services/today-recommendation-engine";
import { normalizeBriefContent, isValidBriefContent } from "@/lib/today-plan-utils";

export { needsBriefIllustrations };
export { warmTodayStoryAudio };

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
    return (user ?? {}) as BriefProfile;
  } catch (error) {
    console.warn("Extended profile fetch failed, using legacy fields:", error);
    const user = await prisma.user.findUnique({ where: { id: userId }, select: LEGACY_PROFILE_SELECT });
    return (user ?? {}) as BriefProfile;
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
  const [profile, memories, recentMessages, memorySignals] = await Promise.all([
    fetchUserProfile(userId),
    prisma.familyMemory.findMany({
      where: { userId },
      select: { content: true, category: true },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.message.findMany({
      where: { conversation: { userId } },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { content: true },
    }),
    safeMemorySignals(userId),
  ]);

  let weeklyFocus = {
    title: "Building Connection",
    reason: "Small moments of presence strengthen your bond this week.",
  };
  try {
    weeklyFocus = await getOrCreateWeeklyFocus(
      userId,
      profile,
      memories,
      memorySignals,
      generateWeeklyFocus
    );
  } catch (error) {
    console.warn("Weekly focus setup failed:", error);
  }

  return {
    profile,
    memories,
    recentMessages: recentMessages.map((m) => m.content),
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
    weeklyFocus = await getOrCreateWeeklyFocus(
      userId,
      profile,
      memories,
      memorySignals,
      generateWeeklyFocus
    );
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
}

/** Regenerate today's plan in the background after profile changes. */
export function warmTodayPlanInBackground(userId: string): void {
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

  const planContext = await buildPlanContext(
    userId,
    profile,
    memories,
    recentMessages,
    weeklyFocus,
    memorySignals,
    weather?.weather ?? null
  );

  let content: DailyBriefContent;
  try {
    content = await generateDailyBrief(planContext, profile);
    if (!isValidBriefContent(content)) {
      throw new Error("AI brief missing required sections");
    }
  } catch (error) {
    console.error("Daily brief AI generation failed, using fallback:", error);
    content = normalizeBriefContent(defaultDailyBrief(profile, weeklyFocus));
  }

  try {
    await prisma.dailyBrief.create({
      data: { userId, date: today, content: content as object },
    });
    warmTodayStoryAudio(userId);
  } catch (error) {
    console.error("Failed to persist daily brief:", error);
  }

  return content;
}

export async function refreshUserWeeklyFocus(userId: string) {
  const { profile, memories, memorySignals } = await fetchRotateContext(userId);
  return refreshWeeklyFocus(userId, profile, memories, memorySignals, generateWeeklyFocus);
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
  const existing = await prisma.dailyBrief.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  if (!existing) {
    await getOrCreateDailyBrief(userId);
  }

  const brief = await prisma.dailyBrief.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  const content = normalizeBriefContent(brief!.content as unknown as DailyBriefContent);
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

  await prisma.dailyBrief.update({
    where: { userId_date: { userId, date: today } },
    data: { content: content as object },
  });

  return content;
}

export async function regenerateDailyBriefSection(
  userId: string,
  section: "recipe" | "play" | "story" | "language"
) {
  const today = toDateKey();
  let brief = await prisma.dailyBrief.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  if (!brief) {
    await getOrCreateDailyBrief(userId);
    brief = await prisma.dailyBrief.findUnique({
      where: { userId_date: { userId, date: today } },
    });
  }

  const content = normalizeBriefContent(brief!.content as unknown as DailyBriefContent);
  const { profile, memories, weeklyFocus, memorySignals } = await fetchRotateContext(userId);
  const weather =
    section === "play" && profile.location
      ? await fetchWeatherForLocation(profile.location)
      : null;

  const planContext = await buildPlanContext(
    userId,
    profile,
    memories,
    [],
    weeklyFocus,
    memorySignals,
    weather?.weather ?? null,
    content.todayFocus
  );

  if (section === "recipe") {
    const recipe = await regenerateRecipe(profile, memories, content.recipe, planContext);
    delete recipe.imageData;
    return updateDailyBriefSection(userId, "recipe", recipe);
  }

  if (section === "play") {
    const play = await regeneratePlay(
      profile,
      memories,
      content.play,
      weather?.weather ?? null,
      planContext
    );
    delete play.imageData;
    return updateDailyBriefSection(userId, "play", play);
  }

  if (section === "story") {
    const story = await regenerateStory(profile, memories, content.bedtimeStory, planContext);
    delete story.illustrationData;
    return updateDailyBriefSection(userId, "story", story);
  }

  const languageItem =
    content.development.find((d) => /language|speech/i.test(d.domain)) ??
    content.development[0];
  const language = await regenerateLanguage(profile, memories, languageItem, planContext);
  return updateDailyBriefSection(userId, "language", language);
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

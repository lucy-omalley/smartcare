import { prisma } from "@/lib/db";
import { generateDailyBrief, regeneratePlay, regenerateRecipe } from "@/lib/services/mumbot";
import { toDateKey, yesterdayDateKey } from "@/lib/date-utils";
import type { DailyBriefContent, DailyBriefPlay, DailyBriefRecipe } from "@/types/daily-brief";

async function fetchBriefContext(userId: string) {
  const [user, memories, recentMessages, reflection] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, childNickname: true, childAge: true, parentingGoal: true },
    }),
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
    prisma.weeklyReflection.findFirst({
      where: { userId },
      orderBy: { weekStart: "desc" },
      select: { content: true },
    }),
  ]);

  const weeklyFocus =
    reflection?.content &&
    typeof reflection.content === "object" &&
    reflection.content !== null &&
    "nextWeekFocus" in reflection.content
      ? String((reflection.content as Record<string, string>).nextWeekFocus)
      : null;

  return {
    profile: user ?? {},
    memories,
    recentMessages: recentMessages.map((m) => m.content),
    weeklyFocus,
  };
}

export async function getOrCreateDailyBrief(userId: string): Promise<DailyBriefContent> {
  const today = toDateKey();

  const existing = await prisma.dailyBrief.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  if (existing) {
    return existing.content as unknown as DailyBriefContent;
  }

  const { profile, memories, recentMessages, weeklyFocus } = await fetchBriefContext(userId);
  const content = await generateDailyBrief(profile, memories, recentMessages, weeklyFocus);

  await prisma.dailyBrief.create({
    data: { userId, date: today, content: content as object },
  });

  return content;
}

export async function updateDailyBriefSection(
  userId: string,
  section: "recipe" | "play",
  value: DailyBriefRecipe | DailyBriefPlay
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

  const content = brief!.content as unknown as DailyBriefContent;
  if (section === "recipe") content.recipe = value as DailyBriefRecipe;
  if (section === "play") content.play = value as DailyBriefPlay;

  await prisma.dailyBrief.update({
    where: { userId_date: { userId, date: today } },
    data: { content: content as object },
  });

  return content;
}

export async function regenerateDailyBriefSection(userId: string, section: "recipe" | "play") {
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

  const content = brief!.content as unknown as DailyBriefContent;
  const { profile, memories } = await fetchBriefContext(userId);

  if (section === "recipe") {
    const recipe = await regenerateRecipe(profile, memories, content.recipe);
    return updateDailyBriefSection(userId, "recipe", recipe);
  }

  const play = await regeneratePlay(profile, memories, content.play);
  return updateDailyBriefSection(userId, "play", play);
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

  const [meetups, weekendActivities, profile, yesterdayMemory] = await Promise.all([
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
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, childNickname: true, childAge: true, parentingGoal: true },
    }),
    getYesterdayJournalMemory(userId),
  ]);

  return { meetups, weekendActivities, profile, yesterdayMemory };
}

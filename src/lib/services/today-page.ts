import { prisma } from "@/lib/db";
import { toDateKey } from "@/lib/date-utils";
import { getOrCreateDailyBrief } from "@/lib/services/daily-brief";
import { getTodayBriefStory } from "@/lib/services/story-audio-cache";
import { generateStoryIllustration } from "@/lib/services/story-media";
import type { DailyBriefContent } from "@/types/daily-brief";

/** Minimal data for the Today dashboard — avoids meetups, weather, and other home-only queries. */
export async function getTodayPageData(userId: string) {
  const [brief, profile] = await Promise.all([
    getOrCreateDailyBrief(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        childNickname: true,
        childAge: true,
        parentingGoals: true,
        priorityGoal: true,
        currentChallenges: true,
      },
    }),
  ]);

  return {
    brief,
    profile: profile ?? { name: "there" },
  };
}

export async function getTodayBriefRecord(userId: string) {
  return prisma.dailyBrief.findUnique({
    where: { userId_date: { userId, date: toDateKey() } },
    select: { content: true },
  });
}

export async function saveTodayStoryIllustration(
  userId: string,
  illustrationData: string
): Promise<DailyBriefContent> {
  const brief = await getTodayBriefRecord(userId);
  if (!brief) throw new Error("Today's brief not found");

  const content = brief.content as unknown as DailyBriefContent;
  content.bedtimeStory = { ...content.bedtimeStory, illustrationData };

  await prisma.dailyBrief.update({
    where: { userId_date: { userId, date: toDateKey() } },
    data: { content: content as object },
  });

  return content;
}

export async function getCachedTodayStoryIllustration(userId: string): Promise<string | null> {
  const brief = await getTodayBriefRecord(userId);
  if (!brief) return null;
  const content = brief.content as unknown as DailyBriefContent;
  return content.bedtimeStory?.illustrationData?.trim() || null;
}

const inflightIllustration = new Map<string, Promise<string>>();

export async function getOrGenerateTodayStoryIllustration(userId: string): Promise<string> {
  const cached = await getCachedTodayStoryIllustration(userId);
  if (cached) return cached;

  const pending = inflightIllustration.get(userId);
  if (pending) return pending;

  const task = (async () => {
    const again = await getCachedTodayStoryIllustration(userId);
    if (again) return again;

    const storyText = await getTodayBriefStory(userId);
    if (!storyText) throw new Error("Today's story not found");

    const record = await getTodayBriefRecord(userId);
    if (!record) throw new Error("Today's brief not found");
    const content = record.content as unknown as DailyBriefContent;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { childNickname: true },
    });

    const illustrationData = await generateStoryIllustration(
      content.bedtimeStory.title,
      storyText,
      user?.childNickname,
      content.bedtimeStory.moral ?? null,
      true
    );

    await saveTodayStoryIllustration(userId, illustrationData);
    return illustrationData;
  })();

  inflightIllustration.set(userId, task);
  try {
    return await task;
  } finally {
    inflightIllustration.delete(userId);
  }
}

export function warmTodayStoryIllustration(userId: string): void {
  void getCachedTodayStoryIllustration(userId).then((cached) => {
    if (cached) return;
    return getOrGenerateTodayStoryIllustration(userId);
  }).catch((err) => {
    console.warn("Story illustration warm failed:", err);
  });
}

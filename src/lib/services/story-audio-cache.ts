import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import { toDateKey } from "@/lib/date-utils";
import { generateStoryNarration } from "@/lib/services/story-media";
import type { DailyBriefContent } from "@/types/daily-brief";

export function hashStoryText(text: string): string {
  return createHash("sha256").update(text.trim()).digest("hex");
}

export async function getTodayBriefStory(userId: string): Promise<string | null> {
  const brief = await prisma.dailyBrief.findUnique({
    where: { userId_date: { userId, date: toDateKey() } },
    select: { content: true },
  });
  if (!brief) return null;
  const content = brief.content as unknown as DailyBriefContent;
  return content.bedtimeStory?.story?.trim() || null;
}

export async function getCachedTodayStoryAudio(
  userId: string,
  storyText: string
): Promise<Buffer | null> {
  const hash = hashStoryText(storyText);
  const brief = await prisma.dailyBrief.findUnique({
    where: { userId_date: { userId, date: toDateKey() } },
    select: { storyAudioData: true, storyAudioHash: true },
  });
  if (brief?.storyAudioData && brief.storyAudioHash === hash) {
    return Buffer.from(brief.storyAudioData);
  }
  return null;
}

export async function saveTodayStoryAudio(
  userId: string,
  storyText: string,
  audio: Buffer
): Promise<void> {
  const hash = hashStoryText(storyText);
  await prisma.dailyBrief.update({
    where: { userId_date: { userId, date: toDateKey() } },
    data: { storyAudioData: audio, storyAudioHash: hash },
  });
}

export async function clearTodayStoryAudio(userId: string): Promise<void> {
  await prisma.dailyBrief.updateMany({
    where: { userId, date: toDateKey() },
    data: { storyAudioData: null, storyAudioHash: null },
  });
}

const inflight = new Map<string, Promise<Buffer>>();

export async function getOrGenerateTodayStoryAudio(userId: string): Promise<Buffer> {
  const storyText = await getTodayBriefStory(userId);
  if (!storyText) {
    throw new Error("Today's story not found");
  }

  const cached = await getCachedTodayStoryAudio(userId, storyText);
  if (cached) return cached;

  const key = `${userId}:${hashStoryText(storyText)}`;
  const pending = inflight.get(key);
  if (pending) return pending;

  const task = (async () => {
    const again = await getCachedTodayStoryAudio(userId, storyText);
    if (again) return again;

    const audio = await generateStoryNarration(storyText);
    await saveTodayStoryAudio(userId, storyText, audio);
    return audio;
  })();

  inflight.set(key, task);
  try {
    return await task;
  } finally {
    inflight.delete(key);
  }
}

export function warmTodayStoryAudio(userId: string): void {
  void getOrGenerateTodayStoryAudio(userId).catch((err) => {
    console.warn("Story audio warm failed:", err);
  });
}

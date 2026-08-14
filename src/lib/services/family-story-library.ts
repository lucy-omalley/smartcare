import "server-only";

import type { StoryCategory } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function listFamilyStories(
  userId: string,
  options?: { q?: string; category?: StoryCategory; favorite?: boolean; limit?: number }
) {
  const where = {
    userId,
    ...(options?.category ? { category: options.category } : {}),
    ...(options?.favorite ? { isFavorite: true } : {}),
    ...(options?.q
      ? {
          OR: [
            { title: { contains: options.q, mode: "insensitive" as const } },
            { story: { contains: options.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  return prisma.familyStory.findMany({
    where,
    orderBy: [{ lastPlayedAt: "desc" }, { createdAt: "desc" }],
    take: options?.limit ?? 50,
    select: {
      id: true,
      title: true,
      category: true,
      lengthMinutes: true,
      moralTheme: true,
      childName: true,
      isFavorite: true,
      playCount: true,
      lastPlayedAt: true,
      createdAt: true,
      bedtimeMood: true,
    },
  });
}

export async function getFamilyStory(userId: string, storyId: string) {
  return prisma.familyStory.findFirst({
    where: { id: storyId, userId },
  });
}

export async function toggleStoryFavorite(userId: string, storyId: string, isFavorite: boolean) {
  return prisma.familyStory.updateMany({
    where: { id: storyId, userId },
    data: { isFavorite },
  });
}

export async function deleteFamilyStory(userId: string, storyId: string) {
  await prisma.familyStory.deleteMany({ where: { id: storyId, userId } });
}

export async function recordStoryPlay(params: {
  userId: string;
  storyId: string;
  voiceProfileId?: string | null;
  narratorType: "STANDARD" | "FAMILY_VOICE";
  listenedSeconds?: number;
  completed?: boolean;
}) {
  await prisma.storyPlaySession.create({
    data: {
      userId: params.userId,
      storyId: params.storyId,
      voiceProfileId: params.voiceProfileId ?? null,
      narratorType: params.narratorType,
      listenedSeconds: params.listenedSeconds ?? 0,
      completed: params.completed ?? false,
    },
  });

  await prisma.familyStory.updateMany({
    where: { id: params.storyId, userId: params.userId },
    data: {
      playCount: { increment: 1 },
      lastPlayedAt: new Date(),
    },
  });
}

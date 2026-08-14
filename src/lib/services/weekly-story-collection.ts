import "server-only";

import { startOfWeek } from "date-fns";
import { prisma } from "@/lib/db";

export async function ensureWeeklyStoryCollection(userId: string, storyId: string) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const title = `My Story Collection — ${weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;

  const collection = await prisma.weeklyStoryCollection.upsert({
    where: { userId_weekStart: { userId, weekStart } },
    create: { userId, weekStart, title },
    update: {},
  });

  await prisma.familyStory.update({
    where: { id: storyId },
    data: { weekCollectionId: collection.id },
  });

  return collection;
}

export async function listWeeklyCollections(userId: string) {
  return prisma.weeklyStoryCollection.findMany({
    where: { userId },
    orderBy: { weekStart: "desc" },
    take: 12,
    include: {
      stories: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          title: true,
          category: true,
          lengthMinutes: true,
          createdAt: true,
          isFavorite: true,
        },
      },
    },
  });
}

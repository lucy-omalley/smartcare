import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import {
  isLegacySavedActivityMemory,
  legacyMemoryToPlay,
} from "@/lib/saved-activities";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [recipes, stories, activities, legacyMemories] = await Promise.all([
    prisma.savedRecipe.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.savedStory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.savedActivity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.familyMemory.findMany({
      where: { userId, category: "LEARNING" },
      orderBy: { createdAt: "desc" },
      select: { id: true, content: true, createdAt: true },
    }),
  ]);

  const legacyActivityCount = legacyMemories.filter((m) =>
    isLegacySavedActivityMemory(m.content)
  ).length;

  const legacyRecent = legacyMemories
    .filter((m) => isLegacySavedActivityMemory(m.content))
    .slice(0, 3)
    .map((m) => ({
      id: m.id,
      title: legacyMemoryToPlay(m.content).title,
      createdAt: m.createdAt.toISOString(),
      source: "memory" as const,
    }));

  const recentActivities = [
    ...activities.slice(0, 3).map((a) => ({
      id: a.id,
      title: a.title,
      createdAt: a.createdAt.toISOString(),
      source: "saved" as const,
    })),
    ...legacyRecent,
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const [recipeTotal, storyTotal] = await Promise.all([
    prisma.savedRecipe.count({ where: { userId } }),
    prisma.savedStory.count({ where: { userId } }),
  ]);

  return NextResponse.json({
    counts: {
      recipes: recipeTotal,
      stories: storyTotal,
      activities: activities.length + legacyActivityCount,
    },
    recent: {
      recipes: recipes.map((r) => ({
        id: r.id,
        title: r.title,
        createdAt: r.createdAt.toISOString(),
      })),
      stories: stories.map((s) => ({
        id: s.id,
        title: s.title,
        createdAt: s.createdAt.toISOString(),
      })),
      activities: recentActivities,
    },
  });
}

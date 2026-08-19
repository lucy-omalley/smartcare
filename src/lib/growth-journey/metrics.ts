import "server-only";

import { prisma } from "@/lib/db";
import type { SkillDomain } from "@/lib/growth-journey/types";

export const WEEKLY_MISSION_TARGET = 5;

export type CompletedMission = {
  id: string;
  label: string;
  completedAt: Date;
  source: "activity" | "language" | "memory" | "story";
};

export type GrowthActivitySnapshot = {
  weeklyCompletedMissions: number;
  weeklyProgressPercent: number;
  activitiesTarget: number;
  streakDays: number;
  hasActivityHistory: boolean;
  completedMissions: CompletedMission[];
  skillProgressById: Record<SkillDomain, number>;
};

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(n)));
}

function extractEventTitle(properties: unknown): string {
  if (!properties || typeof properties !== "object") return "";
  const title = (properties as { title?: unknown }).title;
  return typeof title === "string" ? title : "";
}

function dedupeMissions(missions: CompletedMission[]): CompletedMission[] {
  const seen = new Set<string>();
  const unique: CompletedMission[] = [];

  for (const mission of missions) {
    const dayKey = mission.completedAt.toDateString();
    const normalizedLabel = mission.label
      .replace(/^activity:\s*/i, "")
      .split("\n")[0]
      ?.slice(0, 48)
      .toLowerCase();
    const dedupeKey = `${dayKey}:${normalizedLabel}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    unique.push(mission);
  }

  return unique.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
}

export async function fetchGrowthActivityRecords(userId: string, weekAgo: Date) {
  const [completedEvents, learningMemories, savedStories, allTimeMemoryCount] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: {
        userId,
        createdAt: { gte: weekAgo },
        event: { in: ["activity_completed", "language_activity_completed"] },
      },
      select: { id: true, event: true, properties: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.familyMemory.findMany({
      where: {
        userId,
        createdAt: { gte: weekAgo },
        category: { in: ["LEARNING", "MILESTONE"] },
      },
      select: { id: true, content: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.savedStory.findMany({
      where: { userId, createdAt: { gte: weekAgo } },
      select: { id: true, title: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.familyMemory.count({ where: { userId } }),
  ]);

  return { completedEvents, learningMemories, savedStories, allTimeMemoryCount };
}

export function buildCompletedMissions(
  completedEvents: Awaited<ReturnType<typeof fetchGrowthActivityRecords>>["completedEvents"],
  learningMemories: Awaited<ReturnType<typeof fetchGrowthActivityRecords>>["learningMemories"],
  savedStories: Awaited<ReturnType<typeof fetchGrowthActivityRecords>>["savedStories"]
): CompletedMission[] {
  const missions: CompletedMission[] = [
    ...completedEvents.map((event) => ({
      id: event.id,
      label:
        extractEventTitle(event.properties) ||
        (event.event === "language_activity_completed" ? "Language activity" : "Learning activity"),
      completedAt: event.createdAt,
      source: event.event === "language_activity_completed" ? ("language" as const) : ("activity" as const),
    })),
    ...learningMemories.map((memory) => ({
      id: memory.id,
      label: memory.content.slice(0, 120),
      completedAt: memory.createdAt,
      source: "memory" as const,
    })),
    ...savedStories.map((story) => ({
      id: story.id,
      label: `Story: ${story.title}`,
      completedAt: story.createdAt,
      source: "story" as const,
    })),
  ];

  return dedupeMissions(missions);
}

export function computeStreakDays(missions: CompletedMission[]): number {
  if (missions.length === 0) return 0;
  const days = new Set(missions.map((m) => m.completedAt.toDateString()));
  return Math.min(7, days.size);
}

export function computeSkillProgress(
  keywords: string[],
  missions: CompletedMission[],
  briefSignals: string[]
): number {
  if (missions.length === 0) return 0;

  const briefHaystack = briefSignals.join(" ").toLowerCase();
  const briefMatch = keywords.some((keyword) => briefHaystack.includes(keyword));

  const relevantCount = missions.filter((mission) => {
    const text = mission.label.toLowerCase();
    return keywords.some((keyword) => text.includes(keyword));
  }).length;

  const fromRelevant = Math.min(relevantCount * 20, 70);
  const fromGeneral = Math.min(Math.max(0, missions.length - relevantCount) * 8, 24);
  const briefBoost = briefMatch ? 6 : 0;

  return clamp(fromRelevant + fromGeneral + briefBoost);
}

export function buildGrowthActivitySnapshot(input: {
  completedEvents: Awaited<ReturnType<typeof fetchGrowthActivityRecords>>["completedEvents"];
  learningMemories: Awaited<ReturnType<typeof fetchGrowthActivityRecords>>["learningMemories"];
  savedStories: Awaited<ReturnType<typeof fetchGrowthActivityRecords>>["savedStories"];
  allTimeMemoryCount: number;
  skillCatalog: Array<{ id: SkillDomain; keywords: string[] }>;
  briefSignals: string[];
}): GrowthActivitySnapshot {
  const completedMissions = buildCompletedMissions(
    input.completedEvents,
    input.learningMemories,
    input.savedStories
  );
  const weeklyCompletedMissions = Math.min(completedMissions.length, WEEKLY_MISSION_TARGET);
  const weeklyProgressPercent = clamp((weeklyCompletedMissions / WEEKLY_MISSION_TARGET) * 100);
  const hasActivityHistory = completedMissions.length > 0 || input.allTimeMemoryCount > 0;

  const skillProgressById = Object.fromEntries(
    input.skillCatalog.map((skill) => [
      skill.id,
      computeSkillProgress(skill.keywords, completedMissions, input.briefSignals),
    ])
  ) as Record<SkillDomain, number>;

  return {
    weeklyCompletedMissions,
    weeklyProgressPercent,
    activitiesTarget: WEEKLY_MISSION_TARGET,
    streakDays: computeStreakDays(completedMissions),
    hasActivityHistory,
    completedMissions,
    skillProgressById,
  };
}

export async function getGrowthActivitySnapshot(
  userId: string,
  briefSignals: string[],
  skillCatalog: Array<{ id: SkillDomain; keywords: string[] }>
): Promise<GrowthActivitySnapshot> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const records = await fetchGrowthActivityRecords(userId, weekAgo);
  return buildGrowthActivitySnapshot({
    ...records,
    skillCatalog,
    briefSignals,
  });
}

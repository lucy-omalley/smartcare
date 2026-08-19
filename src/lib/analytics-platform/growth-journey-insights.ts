import "server-only";

import { prisma } from "@/lib/db";
import { startOfDay, subDays, format } from "date-fns";

export type GrowthJourneyFounderMetrics = {
  pageViewsTotal: number;
  pageViews30d: number;
  uniqueUsers30d: number;
  missionsStartedTotal: number;
  missionsStarted30d: number;
  roadmapOpens30d: number;
  skillViews30d: number;
  activityCompletions30d: number;
  usersWithCompletions30d: number;
  todayWidgetViews30d: number;
  topMissions: Array<{ title: string; count: number }>;
  dailyViews: Array<{ day: string; count: number }>;
};

const ENGAGEMENT_EVENTS = [
  "growth_journey_viewed",
  "growth_mission_started",
  "growth_mission_completed",
  "growth_skill_viewed",
  "growth_roadmap_opened",
] as const;

function topFromProps(rows: { properties: unknown }[], key: string, limit = 5) {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const props = row.properties as Record<string, unknown> | null;
    const val = props?.[key];
    if (typeof val === "string" && val.trim()) {
      counts[val.trim()] = (counts[val.trim()] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([title, count]) => ({ title, count }));
}

function fillDailySeries(rows: { day: string; count: bigint }[], days = 14) {
  const todayStart = startOfDay(new Date());
  const map = new Map(rows.map((r) => [r.day, Number(r.count)]));
  const series: { day: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = format(subDays(todayStart, i), "yyyy-MM-dd");
    series.push({ day: d, count: map.get(d) ?? 0 });
  }
  return series;
}

export async function getGrowthJourneyFounderMetrics(): Promise<GrowthJourneyFounderMetrics> {
  const since30 = subDays(startOfDay(new Date()), 30);
  const since14 = subDays(startOfDay(new Date()), 13);

  const [
    pageViewsTotal,
    pageViews30d,
    missionsStartedTotal,
    missionsStarted30d,
    roadmapOpens30d,
    skillViews30d,
    activityCompletions30d,
    todayWidgetViews30d,
    uniqueUsers30d,
    usersWithCompletions30d,
    missionEvents,
    dailyViewRows,
  ] = await Promise.all([
    prisma.analyticsEvent.count({ where: { event: "growth_journey_viewed" } }),
    prisma.analyticsEvent.count({
      where: { event: "growth_journey_viewed", createdAt: { gte: since30 } },
    }),
    prisma.analyticsEvent.count({ where: { event: "growth_mission_started" } }),
    prisma.analyticsEvent.count({
      where: { event: "growth_mission_started", createdAt: { gte: since30 } },
    }),
    prisma.analyticsEvent.count({
      where: { event: "growth_roadmap_opened", createdAt: { gte: since30 } },
    }),
    prisma.analyticsEvent.count({
      where: { event: "growth_skill_viewed", createdAt: { gte: since30 } },
    }),
    prisma.analyticsEvent.count({
      where: {
        event: { in: ["activity_completed", "language_activity_completed"] },
        createdAt: { gte: since30 },
      },
    }),
    prisma.analyticsEvent.count({
      where: {
        event: "growth_journey_viewed",
        createdAt: { gte: since30 },
        properties: { path: ["source"], equals: "today_weekly_growth" },
      },
    }),
    prisma.analyticsEvent.findMany({
      where: {
        event: { in: [...ENGAGEMENT_EVENTS] },
        userId: { not: null },
        createdAt: { gte: since30 },
      },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.analyticsEvent.findMany({
      where: {
        event: { in: ["activity_completed", "language_activity_completed"] },
        userId: { not: null },
        createdAt: { gte: since30 },
      },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.analyticsEvent.findMany({
      where: { event: "growth_mission_started", createdAt: { gte: since30 } },
      select: { properties: true },
      take: 300,
      orderBy: { createdAt: "desc" },
    }),
    prisma.$queryRaw<{ day: string; count: bigint }[]>`
      SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
             COUNT(*)::bigint AS count
      FROM "AnalyticsEvent"
      WHERE event = 'growth_journey_viewed'
        AND "createdAt" >= ${since14}
      GROUP BY 1 ORDER BY 1
    `.catch(() => []),
  ]);

  return {
    pageViewsTotal,
    pageViews30d,
    uniqueUsers30d: uniqueUsers30d.length,
    missionsStartedTotal,
    missionsStarted30d,
    roadmapOpens30d,
    skillViews30d,
    activityCompletions30d,
    usersWithCompletions30d: usersWithCompletions30d.length,
    todayWidgetViews30d,
    topMissions: topFromProps(missionEvents, "title"),
    dailyViews: fillDailySeries(dailyViewRows),
  };
}

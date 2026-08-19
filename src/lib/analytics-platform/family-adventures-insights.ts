import "server-only";

import { prisma } from "@/lib/db";
import { startOfDay, subDays, format } from "date-fns";

export type FamilyAdventuresFounderMetrics = {
  dashboardViewsTotal: number;
  dashboardViews30d: number;
  uniqueUsers30d: number;
  heroClicks30d: number;
  detailViews30d: number;
  cardOpens30d: number;
  savedTotal: number;
  saved30d: number;
  attended30d: number;
  bookingClicks30d: number;
  mapOpens30d: number;
  collectionFilters30d: number;
  topAdventures: Array<{ title: string; count: number }>;
  dailyViews: Array<{ day: string; count: number }>;
};

const ENGAGEMENT_EVENTS = [
  "family_adventures_viewed",
  "family_adventures_hero_clicked",
  "family_adventure_card_opened",
  "family_adventure_detail_viewed",
  "family_adventure_saved",
  "family_adventure_attended",
  "family_adventure_attend_clicked",
  "family_adventure_booking_clicked",
  "family_adventure_map_opened",
  "family_adventure_collection_selected",
] as const;

function topAdventureTitles(rows: { properties: unknown }[], limit = 5) {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const props = row.properties as Record<string, unknown> | null;
    const title =
      (typeof props?.title === "string" && props.title.trim()) ||
      (typeof props?.adventureId === "string" && props.adventureId.trim());
    if (title) counts[title] = (counts[title] ?? 0) + 1;
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

export async function getFamilyAdventuresFounderMetrics(): Promise<FamilyAdventuresFounderMetrics> {
  const since30 = subDays(startOfDay(new Date()), 30);
  const since14 = subDays(startOfDay(new Date()), 13);

  const [
    dashboardViewsTotal,
    dashboardViews30d,
    heroClicks30d,
    detailViews30d,
    cardOpens30d,
    savedEvents30d,
    attended30d,
    bookingClicks30d,
    mapOpens30d,
    collectionFilters30d,
    uniqueUsers30d,
    savedTotal,
    adventureEvents,
    dailyViewRows,
  ] = await Promise.all([
    prisma.analyticsEvent.count({ where: { event: "family_adventures_viewed" } }),
    prisma.analyticsEvent.count({
      where: { event: "family_adventures_viewed", createdAt: { gte: since30 } },
    }),
    prisma.analyticsEvent.count({
      where: { event: "family_adventures_hero_clicked", createdAt: { gte: since30 } },
    }),
    prisma.analyticsEvent.count({
      where: { event: "family_adventure_detail_viewed", createdAt: { gte: since30 } },
    }),
    prisma.analyticsEvent.count({
      where: { event: "family_adventure_card_opened", createdAt: { gte: since30 } },
    }),
    prisma.analyticsEvent.count({
      where: { event: "family_adventure_saved", createdAt: { gte: since30 } },
    }),
    prisma.analyticsEvent.count({
      where: {
        event: { in: ["family_adventure_attended", "family_adventure_attend_clicked"] },
        createdAt: { gte: since30 },
      },
    }),
    prisma.analyticsEvent.count({
      where: { event: "family_adventure_booking_clicked", createdAt: { gte: since30 } },
    }),
    prisma.analyticsEvent.count({
      where: { event: "family_adventure_map_opened", createdAt: { gte: since30 } },
    }),
    prisma.analyticsEvent.count({
      where: { event: "family_adventure_collection_selected", createdAt: { gte: since30 } },
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
    prisma.savedFamilyAdventure.count().catch(() => 0),
    prisma.analyticsEvent.findMany({
      where: {
        event: { in: ["family_adventure_card_opened", "family_adventure_detail_viewed"] },
        createdAt: { gte: since30 },
      },
      select: { properties: true },
      take: 400,
      orderBy: { createdAt: "desc" },
    }),
    prisma.$queryRaw<{ day: string; count: bigint }[]>`
      SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
             COUNT(*)::bigint AS count
      FROM "AnalyticsEvent"
      WHERE event = 'family_adventures_viewed'
        AND "createdAt" >= ${since14}
      GROUP BY 1 ORDER BY 1
    `.catch(() => []),
  ]);

  const savedDb30d = await prisma.savedFamilyAdventure
    .count({ where: { createdAt: { gte: since30 } } })
    .catch(() => 0);

  return {
    dashboardViewsTotal,
    dashboardViews30d,
    uniqueUsers30d: uniqueUsers30d.length,
    heroClicks30d,
    detailViews30d,
    cardOpens30d,
    savedTotal,
    saved30d: Math.max(savedEvents30d, savedDb30d),
    attended30d,
    bookingClicks30d,
    mapOpens30d,
    collectionFilters30d,
    topAdventures: topAdventureTitles(adventureEvents),
    dailyViews: fillDailySeries(dailyViewRows),
  };
}

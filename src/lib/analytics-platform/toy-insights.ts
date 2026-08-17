import "server-only";

import { prisma } from "@/lib/db";
import type { ToyBrainFounderMetrics } from "@/types/toy-brain";

export async function getToyBrainFounderMetrics(): Promise<ToyBrainFounderMetrics> {
  const since30 = new Date(Date.now() - 30 * 86400 * 1000);

  const [totalToys, confirmed, favourites, addedToToday, scans30, events, premiumUsers] =
    await Promise.all([
      prisma.toyProfile.count({ where: { deletedAt: null } }),
      prisma.toyProfile.count({ where: { deletedAt: null, isConfirmed: true } }),
      prisma.toyProfile.count({ where: { deletedAt: null, isFavourite: true } }),
      prisma.toyProfile.count({ where: { deletedAt: null, addedToTodayAt: { not: null } } }),
      prisma.toyProfile.count({ where: { deletedAt: null, createdAt: { gte: since30 } } }),
      prisma.analyticsEvent.findMany({
        where: {
          event: { in: ["toy_brain_scanned", "toy_brain_added_to_today"] },
          createdAt: { gte: since30 },
        },
        select: { event: true, properties: true },
      }),
      prisma.user.count({
        where: {
          planTier: { in: ["PREMIUM", "FAMILY"] },
          toyProfiles: { some: { deletedAt: null } },
        },
      }),
    ]);

  const categoryCounts = await prisma.toyProfile.groupBy({
    by: ["category"],
    where: { deletedAt: null },
    _count: { category: true },
    orderBy: { _count: { category: "desc" } },
    take: 8,
  });

  const activeUsers = await prisma.toyProfile.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: since30 }, deletedAt: null },
  });

  const activityTitles: Record<string, number> = {};
  for (const e of events) {
    if (e.event === "toy_brain_added_to_today") {
      const props = e.properties as { activityTitle?: string } | null;
      const title = props?.activityTitle ?? "Unknown";
      activityTitles[title] = (activityTitles[title] ?? 0) + 1;
    }
  }

  const topActivities = Object.entries(activityTitles)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([title, count]) => ({ title, count }));

  return {
    totalToysScanned: totalToys,
    confirmedToys: confirmed,
    activitiesAddedToToday: addedToToday,
    favouriteToys: favourites,
    topCategories: categoryCounts.map((c) => ({
      category: c.category,
      count: c._count.category,
    })),
    topActivities,
    scansLast30Days: scans30,
    weeklyActiveToyBrainUsers: activeUsers.length,
    premiumConversionSignal: premiumUsers,
  };
}

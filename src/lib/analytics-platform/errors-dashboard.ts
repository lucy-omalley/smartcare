import { prisma } from "@/lib/db";
import { startOfDay, subDays, format } from "date-fns";

export async function getErrorDashboard(days = 14) {
  const since = subDays(startOfDay(new Date()), days);

  const [recent, bySourceRaw, dailyCounts] = await Promise.all([
    prisma.analyticsError.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.analyticsError.groupBy({
      by: ["source"],
      where: { createdAt: { gte: since } },
      _count: { id: true },
    }),
    prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
      FROM "AnalyticsError"
      WHERE "createdAt" >= ${since}
      GROUP BY 1
      ORDER BY 1 ASC
    `.catch(() => [] as Array<{ day: Date; count: bigint }>),
  ]);

  const bySource = [...bySourceRaw].sort((a, b) => b._count.id - a._count.id);

  const crashPages = await prisma.analyticsEvent.findMany({
    where: {
      event: { in: ["frontend_error", "api_error"] },
      createdAt: { gte: since },
    },
    select: { properties: true },
    take: 500,
  });

  const pageCounts = new Map<string, number>();
  for (const row of crashPages) {
    const path =
      (row.properties as { path?: string; page?: string })?.path ??
      (row.properties as { page?: string })?.page ??
      "unknown";
    pageCounts.set(path, (pageCounts.get(path) ?? 0) + 1);
  }

  const topCrashPages = Array.from(pageCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([page, count]) => ({ page, count }));

  return {
    recent,
    bySource: bySource.map((s) => ({ source: s.source, count: s._count.id })),
    daily: dailyCounts.map((d) => ({
      day: format(new Date(d.day), "yyyy-MM-dd"),
      count: Number(d.count),
    })),
    topCrashPages,
    totals: {
      last24h: await prisma.analyticsError.count({
        where: { createdAt: { gte: subDays(new Date(), 1) } },
      }),
      last7d: await prisma.analyticsError.count({
        where: { createdAt: { gte: subDays(new Date(), 7) } },
      }),
    },
  };
}

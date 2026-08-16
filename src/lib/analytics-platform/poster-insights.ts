import "server-only";

import { prisma } from "@/lib/db";
import type { PosterFounderMetrics } from "@/types/routine-poster";

export async function getPosterFounderMetrics(): Promise<PosterFounderMetrics> {
  const since = new Date(Date.now() - 30 * 86_400_000);

  const [
    totalPosters,
    aiPosters,
    postersByTemplate,
    postersByTheme,
    topPrinted,
    analyticsEvents,
    activeUsers,
    premiumUsers,
  ] = await Promise.all([
    prisma.routinePoster.count({ where: { deletedAt: null } }),
    prisma.routinePoster.count({ where: { deletedAt: null, isAiGenerated: true } }),
    prisma.routinePoster.groupBy({
      by: ["templateType"],
      where: { deletedAt: null },
      _count: true,
    }),
    prisma.routinePoster.groupBy({
      by: ["theme"],
      where: { deletedAt: null },
      _count: true,
    }),
    prisma.routinePoster.findMany({
      where: { deletedAt: null, printCount: { gt: 0 } },
      orderBy: { printCount: "desc" },
      take: 8,
      select: { id: true, title: true, printCount: true },
    }),
    prisma.posterAnalyticsEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { eventType: true, posterId: true },
    }),
    prisma.posterAnalyticsEvent.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: since } },
      _count: true,
    }),
    prisma.user.count({
      where: {
        planTier: { in: ["PREMIUM", "FAMILY"] },
        routinePosters: { some: { deletedAt: null } },
      },
    }),
  ]);

  const prints = analyticsEvents.filter((e) => e.eventType === "poster_printed").length;
  const downloads = analyticsEvents.filter((e) => e.eventType === "poster_downloaded").length;
  const qrScans = analyticsEvents.filter((e) => e.eventType === "qr_scanned").length;

  const postersWithQr = await prisma.routinePoster.aggregate({
    where: { deletedAt: null },
    _sum: { qrScanCount: true },
    _count: true,
  });
  const totalQrScans = postersWithQr._sum.qrScanCount ?? 0;
  const avgQrScanRate =
    postersWithQr._count > 0 ? Math.round((totalQrScans / postersWithQr._count) * 100) / 100 : 0;

  return {
    totalPostersCreated: totalPosters,
    aiGeneratedPosters: aiPosters,
    printsLast30Days: prints,
    qrScansLast30Days: qrScans,
    posterDownloadsLast30Days: downloads,
    averageQrScanRate: avgQrScanRate,
    topRoutineTypes: postersByTemplate
      .map((t) => ({ template: t.templateType, count: t._count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    topThemes: postersByTheme
      .map((t) => ({ theme: t.theme, count: t._count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    mostPrintedPosters: topPrinted.map((p) => ({
      posterId: p.id,
      title: p.title,
      printCount: p.printCount,
    })),
    weeklyActivePosterUsers: activeUsers.length,
    premiumConversionSignal: premiumUsers,
  };
}

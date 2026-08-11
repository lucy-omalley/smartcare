import { prisma } from "@/lib/db";
import { startOfDay, subDays } from "date-fns";
import { getCostDashboardStats } from "@/lib/ai/usage";

export async function getFounderAiAnalytics() {
  const todayStart = startOfDay(new Date());
  const weekStart = subDays(todayStart, 7);

  const [todayStats, weekStats, topUsers, topFeatures, latencySample] = await Promise.all([
    getCostDashboardStats(todayStart),
    getCostDashboardStats(weekStart),
    prisma.aIUsageLog.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: todayStart }, userId: { not: null }, cacheHit: false },
      _sum: { estimatedCostUsd: true, promptTokens: true, completionTokens: true },
      _count: { id: true },
    }),
    prisma.aIUsageLog.groupBy({
      by: ["feature"],
      where: { createdAt: { gte: todayStart }, cacheHit: false },
      _sum: { estimatedCostUsd: true },
      _count: { id: true },
    }),
    prisma.aIUsageLog.aggregate({
      where: { createdAt: { gte: todayStart }, cacheHit: false },
      _avg: { promptTokens: true, completionTokens: true },
    }),
  ]);

  const topUsersSorted = [...topUsers]
    .sort((a, b) => (b._sum.estimatedCostUsd ?? 0) - (a._sum.estimatedCostUsd ?? 0))
    .slice(0, 10);

  const userIds = topUsersSorted.map((u) => u.userId!).filter(Boolean);
  const userEmails =
    userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true },
        })
      : [];
  const emailMap = new Map(userEmails.map((u) => [u.id, u.email]));

  return {
    today: {
      calls: todayStats.aiCalls,
      cost: +todayStats.totalCost.toFixed(4),
      cacheHitPct: todayStats.cacheHitPct,
      avgTokensPerRequest:
        todayStats.avgTokensPerRequest > 0
          ? Math.round(todayStats.avgTokensPerRequest)
          : Math.round(
              ((latencySample._avg.promptTokens ?? 0) + (latencySample._avg.completionTokens ?? 0))
            ),
      avgCostPerUser: +todayStats.avgCostPerUser.toFixed(4),
      llmReachPct: todayStats.llmReachPct,
    },
    week: {
      calls: weekStats.aiCalls,
      cost: +weekStats.totalCost.toFixed(4),
      cacheHitPct: weekStats.cacheHitPct,
    },
    topExpensiveUsers: topUsersSorted.map((u) => ({
      userId: u.userId,
      email: emailMap.get(u.userId!) ?? "—",
      calls: u._count.id,
      cost: +(u._sum.estimatedCostUsd ?? 0).toFixed(4),
      tokens: (u._sum.promptTokens ?? 0) + (u._sum.completionTokens ?? 0),
    })),
    costByFeature: [...topFeatures]
      .sort((a, b) => (b._sum.estimatedCostUsd ?? 0) - (a._sum.estimatedCostUsd ?? 0))
      .map((f) => ({
      feature: f.feature,
      calls: f._count.id,
      cost: +(f._sum.estimatedCostUsd ?? 0).toFixed(4),
    })),
    health: todayStats.health,
    targets: todayStats.targets,
  };
}

export async function getTodayPlansAndChats() {
  const todayStart = startOfDay(new Date());
  const [plans, chats] = await Promise.all([
    prisma.analyticsEvent.count({
      where: { event: "today_plan_viewed", createdAt: { gte: todayStart } },
    }),
    prisma.analyticsEvent.count({
      where: { event: "mumbot_question_asked", createdAt: { gte: todayStart } },
    }),
  ]);
  return { plansGenerated: plans, chats };
}

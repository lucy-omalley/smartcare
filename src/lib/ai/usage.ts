import "server-only";

import type { AIFeature, SubscriptionPlan } from "@prisma/client";
import { prisma } from "@/lib/db";
import { toDateKey } from "@/lib/date-utils";
import { MODEL_COST_PER_1M, PLAN_LIMITS } from "@/lib/ai/types";
import type { AIModelTier } from "@/lib/ai/types";

export class UsageLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageLimitError";
  }
}

function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

async function ensureQuota(userId: string) {
  const today = toDateKey();
  const monthStart = startOfMonth();
  const existing = await prisma.userUsageQuota.findUnique({ where: { userId } });
  if (!existing) {
    return prisma.userUsageQuota.create({
      data: {
        userId,
        lastDailyReset: today,
        lastMonthlyReset: monthStart,
      },
    });
  }

  const updates: Record<string, unknown> = {};
  if (existing.lastDailyReset.getTime() !== today.getTime()) {
    updates.dailyPlansToday = 0;
    updates.chatsToday = 0;
    updates.lastDailyReset = today;
  }
  if (existing.lastMonthlyReset.getTime() !== monthStart.getTime()) {
    updates.generationsThisMonth = 0;
    updates.lastMonthlyReset = monthStart;
  }
  if (Object.keys(updates).length === 0) return existing;
  return prisma.userUsageQuota.update({ where: { userId }, data: updates });
}

export async function getUserPlan(userId: string): Promise<SubscriptionPlan> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { planTier: true } });
  return user?.planTier ?? "FREE";
}

export async function assertCanGenerateTodayPlan(userId: string): Promise<void> {
  const [plan, quota] = await Promise.all([getUserPlan(userId), ensureQuota(userId)]);
  const limits = PLAN_LIMITS[plan];
  if (quota.dailyPlansToday >= limits.dailyPlansPerDay) {
    throw new UsageLimitError("Daily plan limit reached. Upgrade to Premium for unlimited plans.");
  }
}

export async function assertCanChat(userId: string): Promise<void> {
  const [plan, quota] = await Promise.all([getUserPlan(userId), ensureQuota(userId)]);
  const limits = PLAN_LIMITS[plan];
  if (quota.chatsToday >= limits.chatsPerDay) {
    throw new UsageLimitError("Daily chat limit reached. Upgrade to Premium for unlimited chats.");
  }
}

export async function assertCanUseAI(userId: string): Promise<void> {
  const [plan, quota] = await Promise.all([getUserPlan(userId), ensureQuota(userId)]);
  const limits = PLAN_LIMITS[plan];
  if (quota.generationsThisMonth >= limits.generationsPerMonth) {
    throw new UsageLimitError("Monthly AI limit reached. Upgrade to Premium for unlimited access.");
  }
}

export async function recordTodayPlanGenerated(userId: string): Promise<void> {
  await ensureQuota(userId);
  await prisma.userUsageQuota.update({
    where: { userId },
    data: {
      dailyPlansToday: { increment: 1 },
      generationsThisMonth: { increment: 1 },
    },
  });
}

export async function recordChatUsed(userId: string): Promise<void> {
  await ensureQuota(userId);
  await prisma.userUsageQuota.update({
    where: { userId },
    data: {
      chatsToday: { increment: 1 },
      generationsThisMonth: { increment: 1 },
    },
  });
}

export function estimateCostUsd(
  tier: AIModelTier,
  promptTokens: number,
  completionTokens: number
): number {
  const rates = MODEL_COST_PER_1M[tier];
  return (promptTokens / 1_000_000) * rates.input + (completionTokens / 1_000_000) * rates.output;
}

export async function logAIUsage(params: {
  userId?: string;
  feature: AIFeature;
  model: string;
  tier: AIModelTier;
  promptTokens: number;
  completionTokens: number;
  cacheHit?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.aIUsageLog.create({
    data: {
      userId: params.userId,
      feature: params.feature,
      model: params.model,
      promptTokens: params.promptTokens,
      completionTokens: params.completionTokens,
      estimatedCostUsd: estimateCostUsd(params.tier, params.promptTokens, params.completionTokens),
      cacheHit: params.cacheHit ?? false,
      metadata: params.metadata as object | undefined,
    },
  });
}

export async function getCostDashboardStats(since: Date) {
  const logs = await prisma.aIUsageLog.findMany({
    where: { createdAt: { gte: since } },
    select: {
      feature: true,
      estimatedCostUsd: true,
      cacheHit: true,
      promptTokens: true,
      completionTokens: true,
      userId: true,
    },
  });

  const totalCost = logs.reduce((s, l) => s + l.estimatedCostUsd, 0);
  const aiCalls = logs.filter((l) => !l.cacheHit).length;
  const cacheHits = logs.filter((l) => l.cacheHit).length;
  const byFeature = new Map<string, { calls: number; cost: number }>();
  const byUser = new Map<string, number>();

  for (const log of logs) {
    const f = byFeature.get(log.feature) ?? { calls: 0, cost: 0 };
    if (!log.cacheHit) f.calls += 1;
    f.cost += log.estimatedCostUsd;
    byFeature.set(log.feature, f);
    if (log.userId) byUser.set(log.userId, (byUser.get(log.userId) ?? 0) + log.estimatedCostUsd);
  }

  const uniqueUsers = byUser.size;
  const avgCostPerUser = uniqueUsers > 0 ? totalCost / uniqueUsers : 0;
  const topFeatures = Array.from(byFeature.entries())
    .sort((a, b) => b[1].cost - a[1].cost)
    .slice(0, 5)
    .map(([feature, stats]) => ({ feature, ...stats }));

  return {
    totalCost,
    aiCalls,
    cacheHits,
    cacheSavingPct: aiCalls + cacheHits > 0 ? cacheHits / (aiCalls + cacheHits) : 0,
    avgCostPerUser,
    uniqueUsers,
    topFeatures,
    estimatedMonthlySpend: totalCost * 30,
  };
}

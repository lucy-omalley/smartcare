import "server-only";

import type { AIFeature, AIRequestResolution, SubscriptionPlan } from "@prisma/client";
import { hasUnlimitedUsage } from "@/lib/admin-auth";
import { effectivePlanTier } from "@/lib/beta-trial";
import { prisma } from "@/lib/db";
import { toDateKey } from "@/lib/date-utils";
import { COST_DASHBOARD_TARGETS, MODEL_COST_PER_1M, PLAN_LIMITS } from "@/lib/ai/types";
import type { AIModelTier } from "@/lib/ai/types";
import { resolveModelForFeature } from "@/lib/ai/router";

/** Features that use semantic cache — CHAT is excluded from cache hit rate */
const CACHE_ELIGIBLE_FEATURES = new Set<AIFeature>(["PERSONALIZE", "WEEKLY_PLAN", "TODAY_PLAN"]);

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
    updates.familyStoriesThisMonth = 0;
    updates.lastMonthlyReset = monthStart;
  }
  if (Object.keys(updates).length === 0) return existing;
  return prisma.userUsageQuota.update({ where: { userId }, data: updates });
}

export async function getUserPlan(userId: string): Promise<SubscriptionPlan> {
  if (await hasUnlimitedUsage(userId)) return "PREMIUM";
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { planTier: true, betaTrialEndsAt: true },
  });
  if (!user) return "FREE";
  return effectivePlanTier(user);
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

/** Increment monthly AI generation counter (journal, fridge meal, etc.). */
export async function recordAiGenerationUsed(userId: string): Promise<void> {
  await ensureQuota(userId);
  await prisma.userUsageQuota.update({
    where: { userId },
    data: { generationsThisMonth: { increment: 1 } },
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

export async function logAIRequest(params: {
  userId?: string;
  feature: AIFeature;
  resolution: AIRequestResolution;
}): Promise<void> {
  await prisma.aIRequestLog
    .create({
      data: {
        userId: params.userId,
        feature: params.feature,
        resolution: params.resolution,
      },
    })
    .catch(() => {});
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
  await prisma.aIUsageLog
    .create({
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
    })
    .catch((err) => {
      console.warn("[ai] usage log failed:", err);
    });
}

export async function logCachedFeatureUsage(params: {
  userId?: string;
  feature: AIFeature;
}): Promise<void> {
  const { model, tier } = resolveModelForFeature(params.feature);
  await logAIUsage({
    userId: params.userId,
    feature: params.feature,
    model,
    tier,
    promptTokens: 0,
    completionTokens: 0,
    cacheHit: true,
  });
}

export async function getCostDashboardStats(since: Date) {
  const [logs, requests] = await Promise.all([
    prisma.aIUsageLog.findMany({
      where: { createdAt: { gte: since } },
      select: {
        feature: true,
        estimatedCostUsd: true,
        cacheHit: true,
        promptTokens: true,
        completionTokens: true,
        userId: true,
      },
    }),
    prisma.aIRequestLog.findMany({
      where: { createdAt: { gte: since } },
      select: { resolution: true },
    }),
  ]);

  const totalCost = logs.reduce((s, l) => s + l.estimatedCostUsd, 0);
  const allLlmLogs = logs.filter((l) => !l.cacheHit);
  const cacheEligibleLogs = logs.filter((l) => CACHE_ELIGIBLE_FEATURES.has(l.feature));
  const aiCalls = allLlmLogs.length;
  const cacheHits = cacheEligibleLogs.filter((l) => l.cacheHit).length;
  const personalizationLlmCalls = cacheEligibleLogs.filter((l) => !l.cacheHit).length;
  const totalTokens = allLlmLogs.reduce((s, l) => s + l.promptTokens + l.completionTokens, 0);
  const avgTokensPerRequest = aiCalls > 0 ? totalTokens / aiCalls : 0;

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

  const aiEligible = cacheHits + personalizationLlmCalls;
  const cacheHitPct = aiEligible > 0 ? cacheHits / aiEligible : 1;
  const cacheMissPct = aiEligible > 0 ? personalizationLlmCalls / aiEligible : 0;

  const totalRequests = requests.length;
  const llmRequests = requests.filter((r) => r.resolution === "LLM").length;
  const dbOnlyRequests = requests.filter((r) => r.resolution === "DB_ONLY").length;
  const requestCacheHits = requests.filter((r) => r.resolution === "CACHE_HIT").length;
  const llmReachPct = totalRequests > 0 ? llmRequests / totalRequests : 0;

  // Healthy when: no cache-eligible calls yet, low sample size, or hit rate in target band
  const cacheHitHealthy =
    aiEligible === 0 ||
    aiEligible < 3 ||
    (cacheHitPct >= COST_DASHBOARD_TARGETS.cacheHitRateMin &&
      cacheHitPct <= COST_DASHBOARD_TARGETS.cacheHitRateMax);
  const llmReachHealthy = totalRequests === 0 || llmReachPct <= COST_DASHBOARD_TARGETS.llmReachRateMax;

  return {
    totalCost,
    aiCalls,
    cacheHits,
    cacheHitPct,
    cacheMissPct,
    cacheSavingPct: cacheHitPct,
    cacheEligibleRequests: aiEligible,
    avgTokensPerRequest,
    avgCostPerUser,
    uniqueUsers,
    topFeatures,
    estimatedMonthlySpend: totalCost * 30,
    totalRequests,
    llmRequests,
    dbOnlyRequests,
    requestCacheHits,
    llmReachPct,
    targets: COST_DASHBOARD_TARGETS,
    health: {
      cacheHit: cacheHitHealthy,
      llmReach: llmReachHealthy,
    },
  };
}

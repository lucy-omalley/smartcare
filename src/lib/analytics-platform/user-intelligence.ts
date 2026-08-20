import { prisma } from "@/lib/db";
import { startOfDay, subDays } from "date-fns";
import { REFERRAL_SOURCE_LABELS } from "@/lib/analytics-platform/referral";
import type { ReferralSource } from "@prisma/client";

export type UserIntelligenceRow = {
  id: string;
  email: string;
  name: string;
  registeredAt: string;
  lastLogin: string | null;
  lastActive: string | null;
  referralSource: string;
  planTier: string;
  childAge: string | null;
  totalSessions: number;
  avgSessionSec: number | null;
  aiCalls: number;
  tokensUsed: number;
  aiCostUsd: number;
  favouriteFeature: string;
  retentionScore: number;
  churnRisk: "low" | "medium" | "high";
  conversionScore: number;
};

export async function getUserIntelligenceList(opts: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ users: UserIntelligenceRow[]; total: number }> {
  const limit = Math.min(opts.limit ?? 50, 100);
  const offset = opts.offset ?? 0;
  const search = opts.search?.trim().toLowerCase();

  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: "insensitive" as const } },
          { name: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        lastLoginAt: true,
        lastActiveAt: true,
        referralSource: true,
        planTier: true,
        childAge: true,
        onboardingComplete: true,
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    }),
  ]);

  const userIds = users.map((u) => u.id);
  if (userIds.length === 0) return { users: [], total };

  const monthStart = subDays(startOfDay(new Date()), 30);

  const [sessions, aiLogs, featureRows] = await Promise.all([
    prisma.analyticsSession.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds } },
      _count: { id: true },
      _avg: { durationSec: true },
    }),
    prisma.aIUsageLog.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, createdAt: { gte: monthStart } },
      _count: { id: true },
      _sum: { promptTokens: true, completionTokens: true, estimatedCostUsd: true },
    }),
    prisma.analyticsEvent.findMany({
      where: {
        userId: { in: userIds },
        event: "feature_used",
        createdAt: { gte: monthStart },
      },
      select: { userId: true, feature: true, properties: true },
    }),
  ]);

  const sessionMap = new Map(
    sessions.map((s) => [
      s.userId,
      { count: s._count.id, avgSec: s._avg.durationSec },
    ])
  );
  const aiMap = new Map(
    aiLogs.map((a) => [
      a.userId,
      {
        calls: a._count.id,
        tokens: (a._sum.promptTokens ?? 0) + (a._sum.completionTokens ?? 0),
        cost: a._sum.estimatedCostUsd ?? 0,
      },
    ])
  );

  const featureMap = new Map<string, Map<string, number>>();
  for (const row of featureRows) {
    if (!row.userId) continue;
    const feat =
      row.feature ??
      (typeof (row.properties as { feature?: string })?.feature === "string"
        ? (row.properties as { feature: string }).feature
        : null);
    if (!feat) continue;
    const m = featureMap.get(row.userId) ?? new Map();
    m.set(feat, (m.get(feat) ?? 0) + 1);
    featureMap.set(row.userId, m);
  }

  const rows: UserIntelligenceRow[] = users.map((u) => {
    const sess = sessionMap.get(u.id);
    const ai = aiMap.get(u.id);
    const feats = featureMap.get(u.id);
    let favouriteFeature = "—";
    if (feats?.size) {
      favouriteFeature = Array.from(feats.entries()).sort((a, b) => b[1] - a[1])[0][0];
    }

    const daysSinceActive = u.lastActiveAt
      ? Math.floor((Date.now() - u.lastActiveAt.getTime()) / 86_400_000)
      : Math.floor((Date.now() - u.createdAt.getTime()) / 86_400_000);

    const retentionScore = scoreRetention(daysSinceActive, sess?.count ?? 0);
    const churnRisk = churnFromScore(retentionScore);
    const conversionScore = scoreConversion(u.planTier, ai?.calls ?? 0, u.onboardingComplete ?? false);

    return {
      id: u.id,
      email: u.email,
      name: u.name,
      registeredAt: u.createdAt.toISOString(),
      lastLogin: u.lastLoginAt?.toISOString() ?? null,
      lastActive: u.lastActiveAt?.toISOString() ?? null,
      referralSource: REFERRAL_SOURCE_LABELS[u.referralSource as ReferralSource] ?? u.referralSource,
      planTier: u.planTier,
      childAge: u.childAge,
      totalSessions: sess?.count ?? 0,
      avgSessionSec: sess?.avgSec ? Math.round(sess.avgSec) : null,
      aiCalls: ai?.calls ?? 0,
      tokensUsed: ai?.tokens ?? 0,
      aiCostUsd: +(ai?.cost ?? 0).toFixed(4),
      favouriteFeature,
      retentionScore,
      churnRisk,
      conversionScore,
    };
  });

  return { users: rows, total };
}

function scoreRetention(daysSinceActive: number, sessions: number): number {
  let score = 100;
  if (daysSinceActive > 30) score -= 60;
  else if (daysSinceActive > 14) score -= 40;
  else if (daysSinceActive > 7) score -= 25;
  else if (daysSinceActive > 3) score -= 10;
  score += Math.min(sessions * 5, 25);
  return Math.max(0, Math.min(100, score));
}

function churnFromScore(score: number): "low" | "medium" | "high" {
  if (score >= 60) return "low";
  if (score >= 35) return "medium";
  return "high";
}

function scoreConversion(planTier: string, aiCalls: number, onboarded: boolean): number {
  if (planTier === "PREMIUM" || planTier === "FAMILY") return 100;
  let score = 0;
  if (onboarded) score += 30;
  if (aiCalls >= 10) score += 35;
  else if (aiCalls >= 3) score += 20;
  if (aiCalls >= 20) score += 25;
  return Math.min(100, score);
}

export type FounderTimelineUser = {
  id: string;
  email: string;
  name: string;
};

const timelineUserSelect = { id: true, email: true, name: true } as const;

/** Resolve a founder journey lookup — email, name, or internal user id. */
export async function searchFounderTimelineUsers(
  query: string,
  limit = 8
): Promise<FounderTimelineUser[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const byId = await prisma.user.findUnique({ where: { id: trimmed }, select: timelineUserSelect });
  if (byId) return [byId];

  if (trimmed.includes("@")) {
    const exactEmail = await prisma.user.findFirst({
      where: { email: { equals: trimmed, mode: "insensitive" } },
      select: timelineUserSelect,
    });
    if (exactEmail) return [exactEmail];
  }

  return prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: trimmed, mode: "insensitive" } },
        { name: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    select: timelineUserSelect,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function resolveFounderTimelineUser(
  query: string
): Promise<FounderTimelineUser | null> {
  const matches = await searchFounderTimelineUsers(query, 1);
  return matches[0] ?? null;
}

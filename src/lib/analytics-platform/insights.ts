import { prisma } from "@/lib/db";
import { startOfDay, subDays } from "date-fns";
import { getFounderMetrics } from "@/lib/services/founder-metrics";
import { getProductFunnel, findBiggestFunnelDropOff } from "@/lib/analytics-platform/funnel";
import { getFounderAiAnalytics, getTodayPlansAndChats } from "@/lib/analytics-platform/ai-analytics";
import { getGrowthJourneyFounderMetrics } from "@/lib/analytics-platform/growth-journey-insights";
import { getFamilyAdventuresFounderMetrics } from "@/lib/analytics-platform/family-adventures-insights";
import { REFERRAL_SOURCE_LABELS } from "@/lib/analytics-platform/referral";
import type { ReferralSource } from "@prisma/client";

export type { GrowthJourneyFounderMetrics } from "@/lib/analytics-platform/growth-journey-insights";
export type { FamilyAdventuresFounderMetrics } from "@/lib/analytics-platform/family-adventures-insights";

export type FounderAlert = {
  level: "info" | "warning" | "critical";
  title: string;
  message: string;
};

export async function generateFounderInsights(): Promise<{
  summary: string;
  bullets: string[];
  alerts: FounderAlert[];
  recommendations: string[];
}> {
  const yesterday = subDays(startOfDay(new Date()), 1);
  const todayStart = startOfDay(new Date());
  const twoDaysAgo = subDays(todayStart, 2);

  const [
    metrics,
    funnel,
    ai,
    todayActivity,
    newUsersYesterday,
    newUsersDayBefore,
    referralGroups,
    errorsYesterday,
  ] = await Promise.all([
    getFounderMetrics(),
    getProductFunnel(subDays(todayStart, 30)),
    getFounderAiAnalytics(),
    getTodayPlansAndChats(),
    prisma.user.count({ where: { createdAt: { gte: yesterday, lt: todayStart } } }),
    prisma.user.count({ where: { createdAt: { gte: twoDaysAgo, lt: yesterday } } }),
    prisma.user.groupBy({ by: ["referralSource"], _count: { id: true } }),
    prisma.analyticsError.count({ where: { createdAt: { gte: yesterday, lt: todayStart } } }),
  ]);

  const dropOff = findBiggestFunnelDropOff(funnel);
  const onboardingCompleted = metrics.events.onboarding_completed ?? 0;

  const bullets = [
    `${newUsersYesterday} new users yesterday`,
    `${onboardingCompleted} users completed onboarding (all time events)`,
    `${metrics.events.today_plan_viewed ?? 0} Today's Plan views (all time)`,
    `Most popular feature: ${metrics.summary.mostUsedFeature}`,
    `Today's AI cost: $${ai.today.cost.toFixed(2)} (${ai.today.calls} calls)`,
    `Today's chats: ${todayActivity.chats}`,
  ];

  const topReferral = referralGroups.sort((a, b) => b._count.id - a._count.id)[0];
  const topReferralLabel = topReferral
    ? REFERRAL_SOURCE_LABELS[topReferral.referralSource as ReferralSource]
    : "Unknown";

  const summary = [
    `Yesterday: ${newUsersYesterday} new users, ${onboardingCompleted} onboarding completions tracked,`,
    `${metrics.summary.dailyActiveUsers} DAU today.`,
    `Top feature: ${metrics.summary.mostUsedFeature}. Top source: ${topReferralLabel}.`,
  ].join(" ");

  const alerts: FounderAlert[] = [];

  if (ai.today.cost > 50) {
    alerts.push({
      level: "critical",
      title: "AI cost spike",
      message: `Today's AI spend is $${ai.today.cost.toFixed(2)} — review top users and cache hit rate.`,
    });
  } else if (ai.today.cost > 20) {
    alerts.push({
      level: "warning",
      title: "Elevated AI cost",
      message: `Today's AI spend is $${ai.today.cost.toFixed(2)}.`,
    });
  }

  if (newUsersDayBefore > 0 && newUsersYesterday < newUsersDayBefore * 0.5) {
    alerts.push({
      level: "warning",
      title: "Registration drop",
      message: `Signups fell from ${newUsersDayBefore} to ${newUsersYesterday} day-over-day.`,
    });
  }

  if (ai.today.cacheHitPct < 0.5 && ai.today.calls > 5) {
    alerts.push({
      level: "warning",
      title: "Low cache hit rate",
      message: `Cache hit rate is ${Math.round(ai.today.cacheHitPct * 100)}% today.`,
    });
  }

  if (errorsYesterday > 10) {
    alerts.push({
      level: "warning",
      title: "Error volume",
      message: `${errorsYesterday} errors logged yesterday.`,
    });
  }

  if (metrics.summary.dailyActiveUsers > 0) {
    const dormantEstimate = metrics.summary.totalUsers - metrics.summary.monthlyActiveUsers;
    if (dormantEstimate > metrics.summary.totalUsers * 0.7 && metrics.summary.totalUsers > 10) {
      alerts.push({
        level: "info",
        title: "Inactive users",
        message: `${dormantEstimate} users haven't been active in 30 days.`,
      });
    }
  }

  const recommendations: string[] = [];
  if (dropOff) {
    recommendations.push(
      `Biggest funnel drop-off: ${dropOff.label} (${100 - (dropOff.conversionFromPrevious ?? 0)}% drop). Prioritize improving this step.`
    );
  }
  if (dropOff?.id === "child_profile" || dropOff?.id === "onboarding") {
    recommendations.push("Simplify onboarding — reduce required profile fields.");
  }
  if (dropOff?.id === "email_verified") {
    recommendations.push(
      "Reduce email verification friction — auto-login after signup, one-click verify link, and reminder emails at 1h / 24h."
    );
    recommendations.push(
      "Export unverified signups from Growth → Follow-up and manually nudge users who never clicked the link."
    );
  }
  if (ai.today.cacheHitPct < 0.7) {
    recommendations.push("Improve semantic cache coverage for personalization prompts.");
  }

  return { summary, bullets, alerts, recommendations };
}

/** Founder homepage — unified operational metrics */
export async function getFounderOverview() {
  const [base, funnel, ai, insights, referralGroups, plansToday, growthJourney, familyAdventures] =
    await Promise.all([
      getFounderMetrics(),
      getProductFunnel(subDays(startOfDay(new Date()), 30)),
      getFounderAiAnalytics(),
      generateFounderInsights(),
      prisma.user.groupBy({ by: ["referralSource"], _count: { id: true } }),
      getTodayPlansAndChats(),
      getGrowthJourneyFounderMetrics(),
      getFamilyAdventuresFounderMetrics(),
    ]);

  const paidUsers = await prisma.user.count({
    where: { planTier: { in: ["PREMIUM", "FAMILY"] } },
  });

  const referralSources = referralGroups
    .map((r) => ({
      source: REFERRAL_SOURCE_LABELS[r.referralSource as ReferralSource] ?? r.referralSource,
      count: r._count.id,
    }))
    .sort((a, b) => b.count - a.count);

  const topReferral = referralSources[0]?.source ?? "—";
  const dropOff = findBiggestFunnelDropOff(funnel);

  const featureUsage = base.charts.featureUsage;
  const leastUsed =
    featureUsage.length > 0
      ? [...featureUsage].sort((a, b) => a.count - b.count)[0]?.feature ?? "—"
      : "—";

  return {
    ...base,
    funnel,
    funnelDropOff: dropOff,
    ai,
    insights,
    acquisition: {
      referralSources,
      topReferral,
    },
    revenue: {
      paidUsers,
      conversionRate:
        base.summary.totalUsers > 0
          ? Math.round((paidUsers / base.summary.totalUsers) * 100)
          : 0,
    },
    today: {
      plansGenerated: plansToday.plansGenerated,
      chats: plansToday.chats,
      aiCost: ai.today.cost,
    },
    features: {
      mostPopular: base.summary.mostUsedFeature,
      leastUsed,
    },
    growthJourney,
    familyAdventures,
  };
}

export type FounderOverview = Awaited<ReturnType<typeof getFounderOverview>>;

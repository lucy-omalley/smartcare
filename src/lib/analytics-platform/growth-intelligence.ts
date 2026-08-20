import { prisma } from "@/lib/db";
import { startOfDay, startOfWeek, subDays, format } from "date-fns";
import { findBiggestFunnelDropOff, type FunnelStage } from "@/lib/analytics-platform/funnel";
import { getCohortRetention } from "@/lib/analytics-platform/retention";
import { getFounderAiAnalytics } from "@/lib/analytics-platform/ai-analytics";
import { generateFounderInsights, type FounderAlert } from "@/lib/analytics-platform/insights";
import {
  getActivatedUserIds,
  getActivationMetrics,
  countOnboardedUsers,
  countRegisteredUsers,
  HERO_FEATURE_EVENTS,
} from "@/lib/analytics-platform/activation";
import { REFERRAL_SOURCE_LABELS } from "@/lib/analytics-platform/referral";
import { getActivationPulse } from "@/lib/activation/time-to-wow";
import type { ReferralSource } from "@prisma/client";

const HERO_FEATURES = {
  toyBrain: {
    label: "Toy Brain",
    views: ["toy_brain_scanned", "feature_used"],
    started: ["toy_brain_scanned"],
    completed: ["toy_brain_added_to_today"],
    saved: ["toy_brain_favourited"],
    printed: ["toy_brain_activity_printed"],
    shared: [] as string[],
  },
  adventure: {
    label: "Adventure Routine",
    views: ["adventure_generated", "poster_created"],
    started: ["adventure_generated"],
    completed: ["adventure_completed"],
    saved: ["poster_created"],
    printed: ["poster_printed", "adventure_printed"],
    shared: ["poster_qr_scanned", "adventure_qr_scanned"],
  },
  familyVoice: {
    label: "Family Voice Story",
    views: ["family_story_generated", "bedtime_mode_opened"],
    started: ["family_story_generated"],
    completed: ["family_story_completed"],
    saved: ["family_story_favorited"],
    printed: [] as string[],
    shared: ["family_story_played"],
  },
  mumbot: {
    label: "MumBot",
    views: ["mumbot_opened"],
    started: ["mumbot_question_asked"],
    completed: ["mumbot_feedback_positive"],
    saved: [] as string[],
    printed: [] as string[],
    shared: [] as string[],
  },
  mealPlanner: {
    label: "Meal Planner",
    views: ["meal_opened", "meal_viewed", "meal_card_opened"],
    started: ["meal_opened"],
    completed: ["meal_saved"],
    saved: ["meal_saved"],
    printed: [] as string[],
    shared: [] as string[],
  },
  todaysJourney: {
    label: "Today's Journey",
    views: ["today_dashboard_viewed", "today_plan_viewed"],
    started: ["activity_opened", "activity_started"],
    completed: ["activity_completed"],
    saved: ["story_saved"],
    printed: [] as string[],
    shared: [] as string[],
  },
} as const;

export type PowerUserSegment = "explorer" | "trying" | "activated" | "engaged" | "champion";

export type UserHealth = "green" | "yellow" | "red";

async function distinctReach(event: string, since?: Date): Promise<number> {
  const dateFilter = since ? { createdAt: { gte: since } } : {};
  const [users, sessions] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: { event, userId: { not: null }, ...dateFilter },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.analyticsEvent.findMany({
      where: { event, userId: null, sessionId: { not: null }, ...dateFilter },
      distinct: ["sessionId"],
      select: { sessionId: true },
    }),
  ]);
  return users.length + sessions.length;
}

async function distinctUsers(event: string, since?: Date): Promise<number> {
  const dateFilter = since ? { createdAt: { gte: since } } : {};
  const rows = await prisma.analyticsEvent.findMany({
    where: { event, userId: { not: null }, ...dateFilter },
    distinct: ["userId"],
    select: { userId: true },
  });
  return rows.length;
}

async function countEmailVerifiedUsers(since?: Date): Promise<number> {
  const dateFilter = since ? { createdAt: { gte: since } } : {};
  const [eventUsers, dbUsers] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: { event: "email_verified", userId: { not: null }, ...dateFilter },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.user.findMany({
      where: {
        emailVerified: { not: null },
        ...(since ? { createdAt: { gte: since } } : {}),
      },
      select: { id: true },
    }),
  ]);
  return new Set([
    ...eventUsers.map((r) => r.userId!),
    ...dbUsers.map((u) => u.id),
  ]).size;
}

/** Growth funnel v1 — last 30 days by default. */
export async function getGrowthFunnel(since?: Date): Promise<FunnelStage[]> {
  const [
    landing,
    signupStarted,
    signupCompleted,
    emailVerified,
    onboardingCompleted,
    childProfile,
    journeyGenerated,
    heroUsed,
    day1Return,
    day7Return,
    premiumStarted,
  ] = await Promise.all([
    distinctReach("landing_page_viewed", since),
    distinctReach("signup_started", since),
    countRegisteredUsers(since),
    countEmailVerifiedUsers(since),
    countOnboardedUsers(since),
    prisma.user.count({
      where: { childBirthday: { not: null }, ...(since ? { createdAt: { gte: since } } : {}) },
    }),
    distinctUsers("first_plan_generated", since).then(async (first) => {
      if (first > 0) return first;
      return distinctUsers("today_plan_viewed", since);
    }),
    distinctUsersForAnyEvent([...HERO_FEATURE_EVENTS], since),
    distinctUsers("day_1_return", since),
    distinctUsers("day_7_return", since),
    prisma.user.count({
      where: {
        planTier: { in: ["PREMIUM", "FAMILY"] },
        ...(since ? { createdAt: { gte: since } } : {}),
      },
    }),
  ]);

  const stages = [
    { id: "landing", label: "Landing page views", count: landing },
    { id: "signup_started", label: "Signup form opened (visitors)", count: signupStarted },
    { id: "signup_completed", label: "Accounts created", count: signupCompleted },
    { id: "email_verified", label: "Email verified", count: emailVerified },
    { id: "onboarding", label: "Onboarding completed", count: onboardingCompleted },
    { id: "child_profile", label: "Child profile created", count: childProfile },
    { id: "journey", label: "Today's Journey generated", count: journeyGenerated },
    { id: "hero", label: "Hero feature used", count: heroUsed },
    { id: "day_1", label: "Returned next day", count: day1Return },
    { id: "day_7", label: "Returned within 7 days", count: day7Return },
    { id: "premium", label: "Premium started", count: premiumStarted },
  ];

  const startCount = stages[0]?.count || 1;
  return stages.map((stage, i) => {
    const prev = i > 0 ? stages[i - 1].count : null;
    return {
      ...stage,
      conversionFromPrevious:
        prev != null && prev > 0 ? Math.round((stage.count / prev) * 100) : i === 0 ? null : 0,
      conversionFromStart: Math.round((stage.count / startCount) * 100),
    };
  });
}

async function distinctUsersForAnyEvent(events: string[], since?: Date): Promise<number> {
  const dateFilter = since ? { createdAt: { gte: since } } : {};
  const rows = await prisma.analyticsEvent.findMany({
    where: { event: { in: events }, userId: { not: null }, ...dateFilter },
    distinct: ["userId"],
    select: { userId: true },
  });
  return rows.length;
}

async function countDistinctUsers(events: string[], since: Date): Promise<number> {
  return distinctUsersForAnyEvent(events, since);
}

export async function getHeroFeatureAnalytics(since?: Date) {
  const sinceDate = since ?? subDays(startOfDay(new Date()), 30);
  const weekBuckets: Record<string, Record<string, number>> = {};

  const features = await Promise.all(
    Object.entries(HERO_FEATURES).map(async ([key, cfg]) => {
      const allEvents = [
        ...cfg.views,
        ...cfg.started,
        ...cfg.completed,
        ...cfg.saved,
        ...cfg.printed,
        ...cfg.shared,
      ];
      const uniqueEvents = Array.from(new Set(allEvents));

      const counts = await Promise.all(
        uniqueEvents.map(async (ev) => ({
          event: ev,
          count: await distinctUsers(ev, sinceDate),
        }))
      );
      const countMap = new Map(counts.map((c) => [c.event, c.count]));

      const sum = (list: readonly string[]) =>
        list.reduce((s, ev) => s + (countMap.get(ev) ?? 0), 0);

      const weeklyRows = await prisma.analyticsEvent.groupBy({
        by: ["event"],
        where: {
          event: { in: uniqueEvents },
          userId: { not: null },
          createdAt: { gte: subDays(new Date(), 7) },
        },
        _count: { id: true },
      });
      const weeklyTotal = weeklyRows.reduce((s, r) => s + r._count.id, 0);

      return {
        id: key,
        label: cfg.label,
        views: sum(cfg.views),
        started: sum(cfg.started),
        completed: sum(cfg.completed),
        saved: sum(cfg.saved),
        printed: sum(cfg.printed),
        shared: sum(cfg.shared),
        weeklyTrend: weeklyTotal,
      };
    })
  );

  const best = [...features].sort((a, b) => b.completed - a.completed)[0] ?? null;
  return { features, bestPerforming: best?.label ?? "—", weekBuckets };
}

export async function getReferralGrowthAnalytics() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      referralSource: true,
      onboardingComplete: true,
      createdAt: true,
      lastActiveAt: true,
    },
  });

  const activatedMap = await getActivatedUserIds();
  const bySource = new Map<
    ReferralSource,
    { signups: number; activated: number; retained: number }
  >();

  const weekAgo = subDays(new Date(), 7);
  for (const u of users) {
    const src = u.referralSource;
    const row = bySource.get(src) ?? { signups: 0, activated: 0, retained: 0 };
    row.signups += 1;
    if (activatedMap.has(u.id)) row.activated += 1;
    if (u.lastActiveAt && u.lastActiveAt >= weekAgo) row.retained += 1;
    bySource.set(src, row);
  }

  const sources = Array.from(bySource.entries())
    .map(([source, stats]) => ({
      source: REFERRAL_SOURCE_LABELS[source],
      sourceKey: source,
      signups: stats.signups,
      activated: stats.activated,
      conversionRate: stats.signups > 0 ? Math.round((stats.activated / stats.signups) * 100) : 0,
      retentionRate: stats.signups > 0 ? Math.round((stats.retained / stats.signups) * 100) : 0,
      activatedRate: stats.signups > 0 ? Math.round((stats.activated / stats.signups) * 100) : 0,
    }))
    .sort((a, b) => b.signups - a.signups);

  return {
    topSource: sources[0]?.source ?? "—",
    sources,
  };
}

function computeHealthScore(flags: {
  onboarding: boolean;
  journey: boolean;
  hero: boolean;
  returned: boolean;
  weeklyActive: boolean;
}): { score: number; health: UserHealth } {
  let score = 0;
  if (flags.onboarding) score += 20;
  if (flags.journey) score += 20;
  if (flags.hero) score += 20;
  if (flags.returned) score += 20;
  if (flags.weeklyActive) score += 20;
  const health: UserHealth = score >= 80 ? "green" : score >= 40 ? "yellow" : "red";
  return { score, health };
}

function classifySegment(input: {
  onboarded: boolean;
  activated: boolean;
  weeklyActive: boolean;
  heroFeatureCount: number;
}): PowerUserSegment {
  if (input.heroFeatureCount >= 3) return "champion";
  if (input.weeklyActive && input.activated) return "engaged";
  if (input.activated) return "activated";
  if (input.onboarded) return "trying";
  return "explorer";
}

export async function getPowerUserSegments() {
  const users = await prisma.user.findMany({
    select: { id: true, onboardingComplete: true, lastActiveAt: true },
  });
  const activatedMap = await getActivatedUserIds();
  const weekAgo = subDays(new Date(), 7);

  const heroEvents = await prisma.analyticsEvent.findMany({
    where: { userId: { not: null }, event: { in: [...HERO_FEATURE_EVENTS] } },
    select: { userId: true, event: true },
  });

  const userEvents = new Map<string, Set<string>>();
  for (const row of heroEvents) {
    if (!row.userId) continue;
    const s = userEvents.get(row.userId) ?? new Set();
    s.add(row.event);
    userEvents.set(row.userId, s);
  }
  const categoryCount = new Map<string, number>();
  for (const [userId, events] of Array.from(userEvents.entries())) {
    let n = 0;
    if (events.has("toy_brain_scanned") || events.has("toy_brain_added_to_today")) n += 1;
    if (
      events.has("adventure_generated") ||
      events.has("poster_created") ||
      events.has("poster_printed")
    )
      n += 1;
    if (
      events.has("family_story_generated") ||
      events.has("family_story_played") ||
      events.has("family_story_completed")
    )
      n += 1;
    categoryCount.set(userId, n);
  }

  const segments: Record<PowerUserSegment, number> = {
    explorer: 0,
    trying: 0,
    activated: 0,
    engaged: 0,
    champion: 0,
  };

  for (const u of users) {
    const activated = activatedMap.has(u.id);
    const weeklyActive = !!(u.lastActiveAt && u.lastActiveAt >= weekAgo);
    const heroFeatureCount = categoryCount.get(u.id) ?? 0;
    const seg = classifySegment({
      onboarded: u.onboardingComplete ?? false,
      activated,
      weeklyActive,
      heroFeatureCount,
    });
    segments[seg] += 1;
  }

  return segments;
}

export async function computeUserHealth(userId: string) {
  const weekAgo = subDays(new Date(), 7);
  const activatedMap = await getActivatedUserIds();
  const user = await prisma.user.findFirst({
    where: { id: userId },
    select: { onboardingComplete: true, lastActiveAt: true },
  });
  if (!user) return { score: 0, health: "red" as UserHealth };

  const [journey, hero, returned] = await Promise.all([
    prisma.analyticsEvent.findFirst({
      where: {
        userId,
        event: { in: ["today_plan_viewed", "first_plan_generated"] },
      },
    }),
    prisma.analyticsEvent.findFirst({
      where: { userId, event: { in: [...HERO_FEATURE_EVENTS] } },
    }),
    prisma.analyticsEvent.findFirst({
      where: { userId, event: { in: ["day_1_return", "day_7_return"] } },
    }),
  ]);

  return computeHealthScore({
    onboarding: user.onboardingComplete ?? false,
    journey: !!journey,
    hero: !!hero,
    returned: !!returned,
    weeklyActive: !!(user.lastActiveAt && user.lastActiveAt >= weekAgo),
  });
}

export async function getExitAnalytics(since?: Date) {
  const sinceDate = since ?? subDays(startOfDay(new Date()), 30);
  const sessions = await prisma.analyticsSession.findMany({
    where: { startedAt: { gte: sinceDate }, bounced: true },
    select: { exitPath: true, durationSec: true, pageViews: true },
    take: 5000,
  });

  const exitPaths: Record<string, number> = {};
  let totalDuration = 0;
  let count = 0;
  for (const s of sessions) {
    const path = s.exitPath ?? "/unknown";
    exitPaths[path] = (exitPaths[path] ?? 0) + 1;
    if (s.durationSec) {
      totalDuration += s.durationSec;
      count += 1;
    }
  }

  const topExits = Object.entries(exitPaths)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([path, count]) => ({ path, count }));

  const abandonedOnboarding = await distinctUsers("onboarding_started", sinceDate).then(
    async (started) => {
      const completed = await distinctUsers("onboarding_completed", sinceDate);
      return Math.max(0, started - completed);
    }
  );

  return {
    avgSessionSec: count > 0 ? Math.round(totalDuration / count) : null,
    topExitPages: topExits,
    abandonedOnboarding,
    abandonedToyBrain: await countAbandoned("toy_brain_scanned", "toy_brain_added_to_today", sinceDate),
    abandonedStory: await countAbandoned("family_story_generated", "family_story_completed", sinceDate),
    abandonedHero: await countAbandoned("adventure_generated", "adventure_completed", sinceDate),
  };
}

async function countAbandoned(startEvent: string, endEvent: string, since: Date): Promise<number> {
  const [started, completed] = await Promise.all([
    distinctUsers(startEvent, since),
    distinctUsers(endEvent, since),
  ]);
  return Math.max(0, started - completed);
}

export async function getOnboardingAnalytics(since?: Date) {
  const sinceDate = since ?? subDays(startOfDay(new Date()), 30);
  const [started, completed, skipped] = await Promise.all([
    distinctUsers("onboarding_started", sinceDate),
    distinctUsers("onboarding_completed", sinceDate),
    distinctUsers("onboarding_skipped", sinceDate),
  ]);

  const completionRate = started > 0 ? Math.round((completed / started) * 100) : 0;

  return {
    started,
    completed,
    skipped,
    completionRate,
    dropOff: Math.max(0, started - completed),
    avgCompletionNote: "Track onboarding_completed duration_seconds in event properties for avg time",
  };
}

export async function getFollowUpList() {
  const weekAgo = subDays(new Date(), 7);
  const twoWeeksAgo = subDays(new Date(), 14);
  const activatedMap = await getActivatedUserIds();

  const [inactiveRegistered, unverifiedEmail, activatedGone, feedbackUsers] = await Promise.all([
    prisma.user.findMany({
      where: {
        onboardingComplete: false,
        createdAt: { lt: weekAgo },
      },
      select: { id: true, email: true, name: true, createdAt: true, referralSource: true },
      take: 50,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: {
        emailVerified: null,
        password: { not: null },
        createdAt: { lt: subDays(new Date(), 1) },
      },
      select: { id: true, email: true, name: true, createdAt: true, referralSource: true },
      take: 50,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: {
        onboardingComplete: true,
        OR: [{ lastActiveAt: { lt: twoWeeksAgo } }, { lastActiveAt: null }],
      },
      select: {
        id: true,
        email: true,
        name: true,
        lastActiveAt: true,
        referralSource: true,
      },
      take: 50,
      orderBy: { lastActiveAt: "asc" },
    }),
    prisma.betaFeedback.findMany({
      select: { userId: true, createdAt: true, improve: true, enjoyed: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const powerUsers = await prisma.user.findMany({
    where: { id: { in: Array.from(activatedMap.keys()).slice(0, 100) } },
    select: { id: true, email: true, name: true, lastActiveAt: true, referralSource: true },
    take: 20,
  });

  const feedbackUserIds = Array.from(
    new Set(feedbackUsers.map((f) => f.userId).filter((id): id is string => !!id))
  );
  const feedbackProfiles =
    feedbackUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: feedbackUserIds } },
          select: { id: true, email: true, name: true, referralSource: true },
        })
      : [];

  return {
    unverifiedEmail: unverifiedEmail.map((u) => ({
      ...u,
      referralSource: REFERRAL_SOURCE_LABELS[u.referralSource],
      reason: "Signed up — email not verified",
    })),
    registeredInactive: inactiveRegistered.map((u) => ({
      ...u,
      referralSource: REFERRAL_SOURCE_LABELS[u.referralSource],
      reason: "Registered but inactive",
    })),
    activatedDisappeared: activatedGone
      .filter((u) => activatedMap.has(u.id))
      .map((u) => ({
        ...u,
        referralSource: REFERRAL_SOURCE_LABELS[u.referralSource],
        reason: "Activated but disappeared",
      })),
    powerUsers: powerUsers.map((u) => ({
      ...u,
      referralSource: REFERRAL_SOURCE_LABELS[u.referralSource],
      reason: "Power user — recommend Premium",
    })),
    sentFeedback: feedbackProfiles.map((u) => ({
      ...u,
      referralSource: REFERRAL_SOURCE_LABELS[u.referralSource],
      reason: "Sent feedback — follow up",
    })),
  };
}

export async function getUserTimeline(userId: string) {
  const milestones = [
    "signup_completed",
    "email_verified",
    "onboarding_completed",
    "child_profile_created",
    "first_plan_generated",
    "today_plan_viewed",
    "toy_brain_scanned",
    "family_story_generated",
    "adventure_generated",
    "mumbot_opened",
    "meal_opened",
    "day_1_return",
    "day_7_return",
  ] as const;

  const events = await prisma.analyticsEvent.findMany({
    where: { userId, event: { in: [...milestones] } },
    orderBy: { createdAt: "asc" },
    select: { event: true, createdAt: true, feature: true },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true, lastActiveAt: true, email: true, name: true },
  });

  const labels: Record<string, string> = {
    signup_completed: "Registered",
    email_verified: "Email verified",
    onboarding_completed: "Completed onboarding",
    child_profile_created: "Created child profile",
    first_plan_generated: "Generated Today's Journey",
    today_plan_viewed: "Opened Today's Plan",
    toy_brain_scanned: "Used Toy Brain",
    family_story_generated: "Generated story",
    adventure_generated: "Created adventure",
    mumbot_opened: "Opened MumBot",
    meal_opened: "Viewed meal plan",
    day_1_return: "Returned next day",
    day_7_return: "Returned within 7 days",
  };

  const timeline = events.map((e) => ({
    label: labels[e.event] ?? e.event,
    at: e.createdAt.toISOString(),
    feature: e.feature,
  }));

  if (user && !timeline.some((t) => t.label === "Registered")) {
    timeline.unshift({
      label: "Registered",
      at: user.createdAt.toISOString(),
      feature: null,
    });
  }

  return {
    user: user
      ? { email: user.email, name: user.name, lastActive: user.lastActiveAt?.toISOString() ?? null }
      : null,
    timeline,
  };
}

export async function generateWeeklyInsights() {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const prevWeekStart = subDays(weekStart, 7);

  const [
    newUsers,
    prevNewUsers,
    onboarding,
    activation,
    hero,
    referral,
    retention,
    ai,
  ] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.user.count({ where: { createdAt: { gte: prevWeekStart, lt: weekStart } } }),
    getOnboardingAnalytics(weekStart),
    getActivationMetrics(),
    getHeroFeatureAnalytics(weekStart),
    getReferralGrowthAnalytics(),
    getCohortRetention(4),
    getFounderAiAnalytics(),
  ]);

  const bullets: string[] = [
    `${newUsers} new users this week (${newUsers >= prevNewUsers ? "up" : "down"} from ${prevNewUsers} prior week)`,
    `${onboarding.completionRate}% onboarding completion`,
    `${activation.activationRate}% overall activation rate`,
    `${hero.bestPerforming} is the top hero feature by completions`,
  ];

  const topTwo = referral.sources.slice(0, 2);
  if (topTwo.length >= 2) {
    const a = topTwo[0];
    const b = topTwo[1];
    if (a.retentionRate > b.retentionRate * 1.5 && b.retentionRate > 0) {
      bullets.push(
        `${a.source} users retain ${Math.round(a.retentionRate / Math.max(b.retentionRate, 1))}x better than ${b.source}`
      );
    }
  }

  if (ai.today.cost > 15) {
    bullets.push(`AI spend today: $${ai.today.cost.toFixed(2)} — monitor costs`);
  }

  return {
    headline: "This week at a glance",
    bullets,
    retentionSummary: retention.summary,
  };
}

export async function getGrowthIntelligenceDashboard() {
  const since30 = subDays(startOfDay(new Date()), 30);
  const todayStart = startOfDay(new Date());

  const [
    activation,
    funnel,
    referral,
    hero,
    retention,
    powerUsers,
    exit,
    onboarding,
    followUp,
    weeklyInsights,
    insights,
    ai,
    registrationsToday,
    activationPulse,
  ] = await Promise.all([
    getActivationMetrics(),
    getGrowthFunnel(since30),
    getReferralGrowthAnalytics(),
    getHeroFeatureAnalytics(since30),
    getCohortRetention(8),
    getPowerUserSegments(),
    getExitAnalytics(since30),
    getOnboardingAnalytics(since30),
    getFollowUpList(),
    generateWeeklyInsights(),
    generateFounderInsights(),
    getFounderAiAnalytics(),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    getActivationPulse(),
  ]);

  const dropOff = findBiggestFunnelDropOff(funnel);
  const alerts: FounderAlert[] = [...insights.alerts];

  if (registrationsToday === 0) {
    alerts.unshift({
      level: "warning",
      title: "No registrations today",
      message: "Zero new signups so far today — check acquisition channels.",
    });
  }

  if (onboarding.completionRate < 50 && onboarding.started > 5) {
    alerts.push({
      level: "warning",
      title: "High onboarding drop-off",
      message: `Only ${onboarding.completionRate}% complete onboarding (${onboarding.dropOff} dropped).`,
    });
  }

  if (hero.bestPerforming === "Toy Brain") {
    alerts.push({
      level: "info",
      title: "Toy Brain leading",
      message: "Toy Brain is the top hero feature — double down on Xiaohongshu toy content.",
    });
  }

  if (activationPulse.avgTimeToWowMinutes != null && activationPulse.avgTimeToWowMinutes > activationPulse.wowTargetMinutes) {
    alerts.push({
      level: "warning",
      title: "Time to WOW above target",
      message: `Average ${activationPulse.avgTimeToWowMinutes} min to first WOW — target under ${activationPulse.wowTargetMinutes} min.`,
    });
  }

  const returningPct =
    retention.summary.day7 > 0
      ? retention.summary.day7
      : 0;

  return {
    generatedAt: new Date().toISOString(),
    activationPulse,
    northStar: activation,
    funnel,
    funnelDropOff: dropOff,
    referral,
    hero,
    retention: {
      ...retention,
      returningUsersPct: returningPct,
      weeklyReturning: retention.summary.day7,
      monthlyReturning: retention.summary.day30,
    },
    powerUsers,
    exit,
    onboarding,
    followUp,
    weeklyInsights,
    alerts,
    ai: { todayCost: ai.today.cost, cacheHitPct: ai.today.cacheHitPct },
  };
}

export type GrowthIntelligenceDashboard = Awaited<ReturnType<typeof getGrowthIntelligenceDashboard>>;

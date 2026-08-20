import { prisma } from "@/lib/db";
import { startOfDay, subDays } from "date-fns";
import { countOnboardedUsers, countRegisteredUsers } from "@/lib/analytics-platform/activation";

export type FunnelStage = {
  id: string;
  label: string;
  count: number;
  conversionFromPrevious: number | null;
  conversionFromStart: number;
};

/** Product funnel — counts distinct users per stage (all time unless since provided). */
export async function getProductFunnel(since?: Date): Promise<FunnelStage[]> {
  const dateFilter = since ? { createdAt: { gte: since } } : {};

  const [
    landing,
    signupStarted,
    signupCompleted,
    emailVerified,
    onboardingCompleted,
    childProfile,
    firstPlan,
    firstSessionWow,
    storyViewed,
    learningPlan,
    weeklyReport,
    premiumUsed,
    feedbackSubmitted,
    day1Return,
    day7Return,
    subscribed,
  ] = await Promise.all([
    distinctUsers("landing_page_viewed", dateFilter),
    distinctReach("signup_started", dateFilter),
    countRegisteredUsers(since),
    countEmailVerifiedUsers(since),
    countOnboardedUsers(since),
    prisma.user.count({ where: { childBirthday: { not: null }, ...(since ? { createdAt: { gte: since } } : {}) } }),
    distinctUsers("today_plan_viewed", dateFilter),
    distinctUsers("first_session_dashboard_viewed", dateFilter),
    distinctUsers("story_opened", dateFilter),
    distinctUsers("learning_plan_generated", dateFilter),
    distinctUsers("weekly_report_viewed", dateFilter),
    distinctUsers("premium_feature_used", dateFilter),
    distinctUsers("today_plan_feedback", dateFilter),
    distinctUsers("day_1_return", dateFilter),
    distinctUsers("day_7_return", dateFilter),
    prisma.user.count({
      where: {
        planTier: { in: ["PREMIUM", "FAMILY"] },
        ...(since ? { createdAt: { gte: since } } : {}),
      },
    }),
  ]);

  const stages: Omit<FunnelStage, "conversionFromPrevious" | "conversionFromStart">[] = [
    { id: "landing", label: "Landing page", count: landing },
    { id: "signup_started", label: "Signup form opened (visitors)", count: signupStarted },
    { id: "signup_completed", label: "Accounts created", count: signupCompleted },
    { id: "email_verified", label: "Email verified", count: emailVerified },
    { id: "onboarding", label: "Onboarding completed", count: onboardingCompleted },
    { id: "child_profile", label: "Child profile (Activated)", count: childProfile },
    { id: "first_plan", label: "First Today's Plan", count: firstPlan },
    { id: "first_wow", label: "First-session dashboard", count: firstSessionWow },
    { id: "story_viewed", label: "Story viewed", count: storyViewed },
    { id: "learning_plan", label: "Learning plan generated", count: learningPlan },
    { id: "weekly_report", label: "Weekly report viewed", count: weeklyReport },
    { id: "premium_feature", label: "Premium feature used", count: premiumUsed },
    { id: "feedback", label: "Feedback submitted", count: feedbackSubmitted },
    { id: "day_1", label: "Returned next day", count: day1Return },
    { id: "day_7", label: "Returned day 7", count: day7Return },
    { id: "subscribed", label: "Subscribed", count: subscribed },
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

async function distinctUsers(
  event: string,
  dateFilter: { createdAt?: { gte: Date } }
): Promise<number> {
  const rows = await prisma.analyticsEvent.findMany({
    where: { event, userId: { not: null }, ...dateFilter },
    distinct: ["userId"],
    select: { userId: true },
  });
  return rows.length;
}

/** Unique visitors who opened signup — includes anonymous sessions (not registrations). */
async function distinctReach(
  event: string,
  dateFilter: { createdAt?: { gte: Date } }
): Promise<number> {
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

/** Users with verified email — merges analytics events and DB flag (covers OAuth). */
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

export function findBiggestFunnelDropOff(stages: FunnelStage[]): FunnelStage | null {
  let worst: FunnelStage | null = null;
  let worstDrop = 0;
  for (const stage of stages) {
    if (stage.conversionFromPrevious == null) continue;
    const drop = 100 - stage.conversionFromPrevious;
    if (drop > worstDrop && stage.count > 0) {
      worstDrop = drop;
      worst = stage;
    }
  }
  return worst;
}

export async function getFunnelLast30Days() {
  return getProductFunnel(subDays(startOfDay(new Date()), 30));
}

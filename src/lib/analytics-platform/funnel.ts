import { prisma } from "@/lib/db";
import { startOfDay, subDays } from "date-fns";

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
    onboardingCompleted,
    childProfile,
    firstPlan,
    day1Return,
    day7Return,
    subscribed,
  ] = await Promise.all([
    distinctUsers("landing_page_viewed", dateFilter),
    distinctUsers("signup_started", dateFilter),
    distinctUsers("signup_completed", dateFilter),
    distinctUsers("onboarding_completed", dateFilter),
    prisma.user.count({ where: { childBirthday: { not: null }, ...(since ? { createdAt: { gte: since } } : {}) } }),
    distinctUsers("today_plan_viewed", dateFilter),
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
    { id: "signup_started", label: "Registration started", count: signupStarted },
    { id: "signup_completed", label: "Registration completed", count: signupCompleted },
    { id: "onboarding", label: "Onboarding completed", count: onboardingCompleted },
    { id: "child_profile", label: "Child profile completed", count: childProfile },
    { id: "first_plan", label: "First Today's Plan", count: firstPlan },
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

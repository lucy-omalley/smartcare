import { prisma } from "@/lib/db";
import { startOfDay, subDays } from "date-fns";

const WOW_EVENTS = [
  "first_plan_generated",
  "today_plan_viewed",
  "wow_moment_viewed",
  "toy_brain_scanned",
  "adventure_generated",
  "family_story_generated",
] as const;

const START_EVENTS = ["signup_completed", "onboarding_completed"] as const;

/** Average minutes from signup to first WOW signal (plan or hero). */
export async function getAverageTimeToWowMinutes(sinceDays = 30): Promise<number | null> {
  const since = subDays(startOfDay(new Date()), sinceDays);

  const recentUsers = await prisma.user.findMany({
    where: { createdAt: { gte: since }, onboardingComplete: true },
    select: { id: true, createdAt: true },
    take: 500,
  });

  if (recentUsers.length === 0) return null;

  const durations: number[] = [];

  for (const user of recentUsers) {
    const startEvent = await prisma.analyticsEvent.findFirst({
      where: {
        userId: user.id,
        event: { in: [...START_EVENTS] },
      },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });

    const wowEvent = await prisma.analyticsEvent.findFirst({
      where: {
        userId: user.id,
        event: { in: [...WOW_EVENTS] },
      },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });

    const startAt = startEvent?.createdAt ?? user.createdAt;
    if (!wowEvent) continue;

    const minutes = (wowEvent.createdAt.getTime() - startAt.getTime()) / 60_000;
    if (minutes >= 0 && minutes < 24 * 60) {
      durations.push(minutes);
    }
  }

  if (durations.length === 0) return null;
  return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
}

export async function getActivationPulse() {
  const todayStart = startOfDay(new Date());
  const weekAgo = subDays(new Date(), 7);

  const [signupsToday, activatedToday, returningToday, avgTimeToWow] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.analyticsEvent.findMany({
      where: {
        event: { in: ["wow_moment_viewed", "first_plan_generated"] },
        createdAt: { gte: todayStart },
        userId: { not: null },
      },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.analyticsEvent.findMany({
      where: {
        event: { in: ["day_1_return", "today_dashboard_viewed"] },
        createdAt: { gte: todayStart },
        userId: { not: null },
      },
      distinct: ["userId"],
      select: { userId: true },
    }),
    getAverageTimeToWowMinutes(30),
  ]);

  const activationRateToday =
    signupsToday > 0 ? Math.round((activatedToday.length / signupsToday) * 100) : 0;

  const returningUsers = await prisma.user.count({
    where: {
      lastActiveAt: { gte: weekAgo },
      createdAt: { lt: todayStart },
    },
  });

  return {
    activationRateToday,
    returningUsersToday: returningToday.length,
    returningParentsWeek: returningUsers,
    avgTimeToWowMinutes: avgTimeToWow,
    signupsToday,
    activatedToday: activatedToday.length,
    wowTargetMinutes: 2,
  };
}

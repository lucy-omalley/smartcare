import { prisma } from "@/lib/db";
import { startOfDay, subDays, format } from "date-fns";

/** Cohort retention: % of signup cohort active on day N */
export async function getCohortRetention(weeks = 8): Promise<{
  cohorts: Array<{
    cohortWeek: string;
    size: number;
    day1: number;
    day3: number;
    day7: number;
    day14: number;
    day30: number;
  }>;
  summary: { day1: number; day3: number; day7: number; day14: number; day30: number };
}> {
  const now = startOfDay(new Date());
  const cohorts: Array<{
    cohortWeek: string;
    size: number;
    day1: number;
    day3: number;
    day7: number;
    day14: number;
    day30: number;
  }> = [];

  for (let w = weeks - 1; w >= 0; w--) {
    const weekStart = subDays(now, w * 7 + 6);
    const weekEnd = subDays(now, w * 7);
    const users = await prisma.user.findMany({
      where: { createdAt: { gte: weekStart, lt: subDays(weekEnd, -1) } },
      select: { id: true, createdAt: true },
    });
    if (users.length === 0) {
      cohorts.push({
        cohortWeek: format(weekStart, "yyyy-MM-dd"),
        size: 0,
        day1: 0,
        day3: 0,
        day7: 0,
        day14: 0,
        day30: 0,
      });
      continue;
    }

    const userIds = users.map((u) => u.id);
    const [d1, d3, d7, d14, d30] = await Promise.all([
      activeAfterSignup(userIds, users, 1),
      activeAfterSignup(userIds, users, 3),
      activeAfterSignup(userIds, users, 7),
      activeAfterSignup(userIds, users, 14),
      activeAfterSignup(userIds, users, 30),
    ]);

    cohorts.push({
      cohortWeek: format(weekStart, "yyyy-MM-dd"),
      size: users.length,
      day1: pct(d1, users.length),
      day3: pct(d3, users.length),
      day7: pct(d7, users.length),
      day14: pct(d14, users.length),
      day30: pct(d30, users.length),
    });
  }

  const withSize = cohorts.filter((c) => c.size > 0);
  const avg = (key: "day1" | "day3" | "day7" | "day14" | "day30") =>
    withSize.length > 0
      ? Math.round(withSize.reduce((s, c) => s + c[key], 0) / withSize.length)
      : 0;

  return {
    cohorts,
    summary: {
      day1: avg("day1"),
      day3: avg("day3"),
      day7: avg("day7"),
      day14: avg("day14"),
      day30: avg("day30"),
    },
  };
}

function pct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

async function activeAfterSignup(
  userIds: string[],
  users: { id: string; createdAt: Date }[],
  dayOffset: number
): Promise<number> {
  let active = 0;
  for (const user of users) {
    const windowStart = subDays(startOfDay(user.createdAt), -dayOffset);
    const windowEnd = subDays(windowStart, -1);
    const hit = await prisma.analyticsEvent.findFirst({
      where: {
        userId: user.id,
        createdAt: { gte: windowStart, lt: windowEnd },
      },
      select: { id: true },
    });
    if (hit) active += 1;
  }
  return active;
}

export async function getDormantUsers(daysInactive = 14, limit = 50) {
  const cutoff = subDays(new Date(), daysInactive);
  return prisma.user.findMany({
    where: {
      OR: [{ lastActiveAt: { lt: cutoff } }, { lastActiveAt: null, createdAt: { lt: cutoff } }],
      onboardingComplete: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      lastActiveAt: true,
      lastLoginAt: true,
      planTier: true,
      createdAt: true,
    },
    orderBy: { lastActiveAt: "asc" },
    take: limit,
  });
}

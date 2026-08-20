import { prisma } from "@/lib/db";
import { startOfDay, startOfWeek, subDays } from "date-fns";

/** Hero feature events — at least one required for activation. */
export const HERO_FEATURE_EVENTS = [
  "toy_brain_scanned",
  "toy_brain_added_to_today",
  "adventure_generated",
  "poster_created",
  "poster_printed",
  "family_story_generated",
  "family_story_played",
  "family_story_completed",
] as const;

/** Real accounts in the User table — source of truth for registration counts. */
export async function countRegisteredUsers(since?: Date): Promise<number> {
  return prisma.user.count({
    where: since ? { createdAt: { gte: since } } : {},
  });
}

/** Users who finished onboarding (DB flag). */
export async function countOnboardedUsers(since?: Date): Promise<number> {
  return prisma.user.count({
    where: {
      onboardingComplete: true,
      ...(since ? { createdAt: { gte: since } } : {}),
    },
  });
}

export type ActivatedUserCriteria = {
  userId: string;
  activatedAt: Date;
};

/** User is Activated: onboarding + Today's Journey + ≥1 hero feature. */
export async function getActivatedUserIds(since?: Date): Promise<Map<string, Date>> {
  const userFilter = since ? { createdAt: { gte: since } } : {};

  const onboarded = await prisma.user.findMany({
    where: { onboardingComplete: true, ...userFilter },
    select: { id: true, createdAt: true },
  });
  if (onboarded.length === 0) return new Map();

  const ids = onboarded.map((u) => u.id);

  const [journeyUsers, heroUsers] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: {
        userId: { in: ids },
        event: { in: ["today_plan_viewed", "first_plan_generated", "today_dashboard_viewed"] },
      },
      distinct: ["userId"],
      select: { userId: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.analyticsEvent.findMany({
      where: {
        userId: { in: ids },
        event: { in: [...HERO_FEATURE_EVENTS] },
      },
      distinct: ["userId"],
      select: { userId: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const journeySet = new Set(journeyUsers.map((r) => r.userId).filter(Boolean) as string[]);
  const heroMap = new Map<string, Date>();
  for (const row of heroUsers) {
    if (!row.userId) continue;
    if (!heroMap.has(row.userId)) heroMap.set(row.userId, row.createdAt);
  }

  const activated = new Map<string, Date>();
  for (const u of onboarded) {
    if (!journeySet.has(u.id) || !heroMap.has(u.id)) continue;
    activated.set(u.id, heroMap.get(u.id)!);
  }
  return activated;
}

export async function getActivationMetrics() {
  const todayStart = startOfDay(new Date());
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const last30Start = subDays(todayStart, 30);

  const [allActivated, signupsTotal, signupsWeek, signupsLast30Days] = await Promise.all([
    getActivatedUserIds(),
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
    countRegisteredUsers(last30Start),
  ]);

  let activatedToday = 0;
  let activatedThisWeek = 0;
  for (const activatedAt of Array.from(allActivated.values())) {
    if (activatedAt >= todayStart) activatedToday += 1;
    if (activatedAt >= weekStart) activatedThisWeek += 1;
  }

  const activationRate =
    signupsTotal > 0 ? Math.round((allActivated.size / signupsTotal) * 100) : 0;

  return {
    totalActivated: allActivated.size,
    activatedToday,
    activatedThisWeek,
    activationRate,
    signupsTotal,
    signupsThisWeek: signupsWeek,
    signupsLast30Days,
  };
}

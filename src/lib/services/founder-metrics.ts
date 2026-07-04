import { prisma } from "@/lib/db";
import { startOfDay, subDays, format } from "date-fns";

function countMap(rows: { key: string; count: bigint }[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of rows) {
    out[row.key] = Number(row.count);
  }
  return out;
}

export async function getFounderMetrics() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = subDays(todayStart, 7);
  const monthStart = subDays(todayStart, 30);

  const [
    totalUsers,
    newUsersToday,
    usersWithOnboarding,
    eventCounts,
    dauRows,
    wauRows,
    mauRows,
    recentErrors,
    feedbackCount,
    connectEvents,
    connectRequests,
    checkins,
    allUsersGoals,
    allUsersChallenges,
    allChildAges,
    featureUsage,
    dailyActiveSeries,
    dailySignupSeries,
    topStories,
    topMeals,
    topActivities,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.user.count({ where: { onboardingComplete: true } }),
    prisma.analyticsEvent.groupBy({
      by: ["event"],
      _count: { event: true },
    }),
    prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: todayStart }, userId: { not: null } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: weekStart }, userId: { not: null } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: monthStart }, userId: { not: null } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.analyticsError.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, source: true, message: true, createdAt: true },
    }),
    prisma.analyticsEvent.count({ where: { event: "feedback_submitted" } }),
    prisma.connectEvent.count(),
    prisma.connectRequest.count(),
    prisma.analyticsEvent.count({ where: { event: "parent_checkin_completed" } }),
    prisma.user.findMany({ select: { parentingGoals: true } }),
    prisma.user.findMany({ select: { currentChallenges: true } }),
    prisma.user.findMany({ where: { childAge: { not: null } }, select: { childAge: true } }),
    prisma.$queryRaw<{ feature: string; count: bigint }[]>`
      SELECT properties->>'feature' AS feature, COUNT(*)::bigint AS count
      FROM "AnalyticsEvent"
      WHERE event = 'feature_used' AND properties->>'feature' IS NOT NULL
      GROUP BY properties->>'feature'
      ORDER BY count DESC
      LIMIT 10
    `.catch(() => []),
    prisma.$queryRaw<{ day: string; count: bigint }[]>`
      SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
             COUNT(DISTINCT "userId")::bigint AS count
      FROM "AnalyticsEvent"
      WHERE "createdAt" >= ${subDays(todayStart, 13)} AND "userId" IS NOT NULL
      GROUP BY 1 ORDER BY 1
    `.catch(() => []),
    prisma.$queryRaw<{ day: string; count: bigint }[]>`
      SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
             COUNT(*)::bigint AS count
      FROM "User"
      WHERE "createdAt" >= ${subDays(todayStart, 13)}
      GROUP BY 1 ORDER BY 1
    `.catch(() => []),
    prisma.analyticsEvent.findMany({
      where: { event: { in: ["story_card_opened", "story_started", "story_saved"] } },
      take: 200,
      orderBy: { createdAt: "desc" },
      select: { properties: true },
    }),
    prisma.analyticsEvent.findMany({
      where: { event: { in: ["meal_card_opened", "meal_viewed", "meal_saved"] } },
      take: 200,
      orderBy: { createdAt: "desc" },
      select: { properties: true },
    }),
    prisma.analyticsEvent.findMany({
      where: { event: { in: ["activity_card_opened", "activity_started"] } },
      take: 200,
      orderBy: { createdAt: "desc" },
      select: { properties: true },
    }),
  ]);

  const events: Record<string, number> = {};
  for (const row of eventCounts) {
    events[row.event] = row._count.event;
  }

  const goalCounts: Record<string, number> = {};
  for (const u of allUsersGoals) {
    for (const g of u.parentingGoals) {
      goalCounts[g] = (goalCounts[g] ?? 0) + 1;
    }
  }

  const challengeCounts: Record<string, number> = {};
  for (const u of allUsersChallenges) {
    for (const c of u.currentChallenges) {
      challengeCounts[c] = (challengeCounts[c] ?? 0) + 1;
    }
  }

  const ageCounts: Record<string, number> = {};
  for (const u of allChildAges) {
    if (u.childAge) ageCounts[u.childAge] = (ageCounts[u.childAge] ?? 0) + 1;
  }

  const topFromProps = (rows: { properties: unknown }[], key: string) => {
    const counts: Record<string, number> = {};
    for (const row of rows) {
      const props = row.properties as Record<string, unknown> | null;
      const val = props?.[key];
      if (typeof val === "string" && val.trim()) {
        counts[val] = (counts[val] ?? 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  };

  const mumbotQuestions = events.mumbot_question_asked ?? 0;
  const storiesRead = (events.story_started ?? 0) + (events.story_card_opened ?? 0);
  const mealsViewed = (events.meal_viewed ?? 0) + (events.meal_card_opened ?? 0);
  const activitiesStarted = (events.activity_started ?? 0) + (events.activity_card_opened ?? 0);

  const featureMap = countMap(
    featureUsage.map((r) => ({ key: r.feature || "Unknown", count: r.count }))
  );
  const mostUsedFeature =
    Object.entries(featureMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const returningUsers =
    (events.day_1_return ?? 0) +
    (events.day_3_return ?? 0) +
    (events.day_7_return ?? 0) +
    (events.day_30_return ?? 0);

  const fillSeries = (rows: { day: string; count: bigint }[], days = 14) => {
    const map = new Map(rows.map((r) => [r.day, Number(r.count)]));
    const series: { day: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = format(subDays(todayStart, i), "yyyy-MM-dd");
      series.push({ day: d, count: map.get(d) ?? 0 });
    }
    return series;
  };

  return {
    summary: {
      totalUsers,
      newUsersToday,
      dailyActiveUsers: dauRows.length,
      weeklyActiveUsers: wauRows.length,
      monthlyActiveUsers: mauRows.length,
      onboardingCompleted: usersWithOnboarding,
      onboardingRate: totalUsers > 0 ? Math.round((usersWithOnboarding / totalUsers) * 100) : 0,
      avgMumbotQuestionsPerUser: totalUsers > 0 ? +(mumbotQuestions / totalUsers).toFixed(1) : 0,
      storiesRead,
      mealsViewed,
      activitiesStarted,
      connectRequests,
      eventsCreated: connectEvents,
      parentCheckins: checkins,
      feedbackSubmitted: feedbackCount,
      returningUsers,
      mostUsedFeature,
    },
    events,
    charts: {
      dailyActiveUsers: fillSeries(dailyActiveSeries),
      weeklySignups: fillSeries(dailySignupSeries),
      featureUsage: Object.entries(featureMap).map(([feature, count]) => ({ feature, count })),
      retention: [
        { label: "Day 1", count: events.day_1_return ?? 0 },
        { label: "Day 3", count: events.day_3_return ?? 0 },
        { label: "Day 7", count: events.day_7_return ?? 0 },
        { label: "Day 30", count: events.day_30_return ?? 0 },
      ],
      mumbotUsage: [
        { label: "Questions", count: events.mumbot_question_asked ?? 0 },
        { label: "Stories", count: events.mumbot_story_generated ?? 0 },
        { label: "Recipes", count: events.mumbot_recipe_generated ?? 0 },
        { label: "Activities", count: events.mumbot_activity_generated ?? 0 },
      ],
      connectUsage: [
        { label: "Available today", count: events.available_today_created ?? 0 },
        { label: "Events", count: events.event_created ?? 0 },
        { label: "Join requests", count: events.event_join_requested ?? 0 },
        { label: "Connections", count: events.connection_interest_sent ?? 0 },
      ],
    },
    insights: {
      topParentingGoals: Object.entries(goalCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => ({ name, count })),
      topChallenges: Object.entries(challengeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => ({ name, count })),
      topChildAges: Object.entries(ageCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => ({ name, count })),
      topStories: topFromProps(topStories, "title"),
      topMeals: topFromProps(topMeals, "title"),
      topActivities: topFromProps(topActivities, "title"),
    },
    recentErrors,
    generatedAt: now.toISOString(),
  };
}

export type FounderMetrics = Awaited<ReturnType<typeof getFounderMetrics>>;

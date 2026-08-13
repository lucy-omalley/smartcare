import "server-only";

import { prisma } from "@/lib/db";
import { subDays } from "date-fns";

export async function getFeedbackInsights() {
  const since = subDays(new Date(), 30);

  const [todayFeedback, betaFeedback, featureRequests, ratingEvents] = await Promise.all([
    prisma.todayPlanFeedback.findMany({
      where: { createdAt: { gte: since } },
      select: { rating: true, comment: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.betaFeedback.findMany({
      where: { createdAt: { gte: since } },
      select: { enjoyed: true, confused: true, improve: true, rating: true },
      take: 200,
    }),
    prisma.featureRequest.findMany({
      orderBy: { voteCount: "desc" },
      take: 15,
      select: { id: true, title: true, voteCount: true, status: true },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["event"],
      where: {
        createdAt: { gte: since },
        event: {
          in: [
            "today_plan_feedback",
            "learning_plan_generated",
            "weekly_report_viewed",
            "story_opened",
            "premium_feature_used",
          ],
        },
      },
      _count: { id: true },
    }),
  ]);

  const helpful = todayFeedback.filter((f) => f.rating === 3).length;
  const okay = todayFeedback.filter((f) => f.rating === 2).length;
  const notHelpful = todayFeedback.filter((f) => f.rating === 1).length;

  const complaints = [
    ...todayFeedback.filter((f) => f.rating === 1 && f.comment).map((f) => f.comment!),
    ...betaFeedback.filter((f) => f.confused?.trim()).map((f) => f.confused!.trim()),
  ].slice(0, 20);

  const positiveThemes = betaFeedback
    .filter((f) => f.enjoyed?.trim())
    .map((f) => f.enjoyed!.trim())
    .slice(0, 15);

  const featureIdeas = betaFeedback
    .filter((f) => f.improve?.trim())
    .map((f) => f.improve!.trim())
    .slice(0, 15);

  const avgBetaRating =
    betaFeedback.filter((f) => f.rating != null).length > 0
      ? betaFeedback.reduce((s, f) => s + (f.rating ?? 0), 0) /
        betaFeedback.filter((f) => f.rating != null).length
      : null;

  return {
    todayPlanRatings: { helpful, okay, notHelpful, total: todayFeedback.length },
    avgBetaRating,
    topFeatureRequests: featureRequests,
    recentComplaints: complaints,
    positiveThemes,
    legacyFeatureIdeas: featureIdeas,
    featureUsage: ratingEvents.map((e) => ({ event: e.event, count: e._count.id })),
    weeklyTrend: {
      feedbackSubmitted: todayFeedback.length + betaFeedback.length,
      notHelpfulRate:
        todayFeedback.length > 0 ? Math.round((notHelpful / todayFeedback.length) * 100) : 0,
    },
  };
}

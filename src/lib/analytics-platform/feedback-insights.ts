import "server-only";

import { prisma } from "@/lib/db";
import { subDays } from "date-fns";

export type FeedbackSubmissionRow = {
  id: string;
  kind: "beta" | "today_plan";
  submittedAt: string;
  userName: string | null;
  userEmail: string | null;
  userId: string | null;
  rating: number | null;
  ratingLabel: string | null;
  summary: string;
  confused: string | null;
  improve: string | null;
  enjoyed: string | null;
  page: string | null;
  isBugReport: boolean;
};

function todayPlanRatingLabel(rating: number): string {
  if (rating === 3) return "Very helpful";
  if (rating === 2) return "Okay";
  return "Not helpful";
}

async function getFeedbackSubmissions(since: Date): Promise<FeedbackSubmissionRow[]> {
  const [betaRows, todayRows] = await Promise.all([
    prisma.betaFeedback.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 150,
    }),
    prisma.todayPlanFeedback.findMany({
      where: { createdAt: { gte: since } },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 150,
    }),
  ]);

  const userIds = Array.from(new Set(betaRows.map((r) => r.userId).filter(Boolean))) as string[];
  const users =
    userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const betaSubmissions: FeedbackSubmissionRow[] = betaRows.map((row) => {
    const user = row.userId ? userMap.get(row.userId) : null;
    const primary =
      row.confused?.trim() || row.improve?.trim() || row.enjoyed?.trim() || "No comment";
    return {
      id: row.id,
      kind: "beta",
      submittedAt: row.createdAt.toISOString(),
      userName: user?.name ?? (row.signedIn ? null : "Guest (signed out)"),
      userEmail: user?.email ?? null,
      userId: row.userId,
      rating: row.rating,
      ratingLabel: row.rating != null ? `${row.rating}/5` : null,
      summary: primary.slice(0, 400),
      confused: row.confused?.trim() || null,
      improve: row.improve?.trim() || null,
      enjoyed: row.enjoyed?.trim() || null,
      page: row.page,
      isBugReport: Boolean(row.confused?.trim()),
    };
  });

  const todaySubmissions: FeedbackSubmissionRow[] = todayRows.map((row) => ({
    id: row.id,
    kind: "today_plan",
    submittedAt: row.createdAt.toISOString(),
    userName: row.user.name,
    userEmail: row.user.email,
    userId: row.user.id,
    rating: row.rating,
    ratingLabel: todayPlanRatingLabel(row.rating),
    summary: row.comment?.trim() || todayPlanRatingLabel(row.rating),
    confused: null,
    improve: null,
    enjoyed: null,
    page: null,
    isBugReport: row.rating === 1,
  }));

  return [...betaSubmissions, ...todaySubmissions].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}

export async function getFeedbackInsights() {
  const since = subDays(new Date(), 30);

  const [todayFeedback, betaFeedback, featureRequests, ratingEvents, submissions] =
    await Promise.all([
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
      select: {
        id: true,
        title: true,
        voteCount: true,
        status: true,
        createdAt: true,
        submitter: { select: { name: true, email: true } },
      },
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
    getFeedbackSubmissions(since),
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
    topFeatureRequests: featureRequests.map((f) => ({
      id: f.id,
      title: f.title,
      voteCount: f.voteCount,
      status: f.status,
      submittedAt: f.createdAt.toISOString(),
      submitterName: f.submitter?.name ?? null,
      submitterEmail: f.submitter?.email ?? null,
    })),
    recentComplaints: complaints,
    positiveThemes,
    legacyFeatureIdeas: featureIdeas,
    featureUsage: ratingEvents.map((e) => ({ event: e.event, count: e._count.id })),
    weeklyTrend: {
      feedbackSubmitted: todayFeedback.length + betaFeedback.length,
      notHelpfulRate:
        todayFeedback.length > 0 ? Math.round((notHelpful / todayFeedback.length) * 100) : 0,
    },
    submissions,
  };
}

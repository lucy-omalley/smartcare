import { prisma } from "@/lib/db";
import { startOfDay, subDays } from "date-fns";

export type BetaUserRow = {
  userId: string;
  email: string;
  name: string;
  sessions: number;
  events: number;
  feedbackCount: number;
  lastActive: string | null;
  registeredAt: string;
  inviteStatus: "active" | "dormant" | "new";
};

/** Top beta users by product engagement */
export async function getBetaUserDashboard(limit = 20) {
  const monthStart = subDays(startOfDay(new Date()), 30);

  const [feedbackTotal, feedbackByUser, topByEvents] = await Promise.all([
    prisma.betaFeedback.count(),
    prisma.betaFeedback.groupBy({
      by: ["userId"],
      where: { userId: { not: null } },
      _count: { id: true },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["userId"],
      where: { userId: { not: null }, createdAt: { gte: monthStart } },
      _count: { id: true },
    }),
  ]);

  const topByEventsSorted = [...topByEvents].sort((a, b) => b._count.id - a._count.id).slice(0, limit * 2);

  const userIds = topByEventsSorted.map((r) => r.userId!).filter(Boolean);
  if (userIds.length === 0) {
    return { users: [] as BetaUserRow[], totals: { feedback: feedbackTotal, featureRequests: 0, bugReports: 0 } };
  }

  const [users, sessions, recentFeedback] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true, createdAt: true, lastActiveAt: true },
    }),
    prisma.analyticsSession.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, startedAt: { gte: monthStart } },
      _count: { id: true },
    }),
    prisma.betaFeedback.findMany({
      where: { createdAt: { gte: monthStart } },
      select: { improve: true, confused: true },
    }),
  ]);

  const userMap = new Map(users.map((u) => [u.id, u]));
  const sessionMap = new Map(sessions.map((s) => [s.userId, s._count.id]));
  const feedbackMap = new Map(
    feedbackByUser.filter((f) => f.userId).map((f) => [f.userId!, f._count.id])
  );

  const featureRequests = recentFeedback.filter((f) => f.improve?.trim()).length;
  const bugReports = recentFeedback.filter((f) => f.confused?.trim()).length;

  const rows: BetaUserRow[] = topByEventsSorted
    .slice(0, limit)
    .map((row) => {
      const u = userMap.get(row.userId!);
      if (!u) return null;
      const daysSinceSignup = Math.floor((Date.now() - u.createdAt.getTime()) / 86_400_000);
      const daysSinceActive = u.lastActiveAt
        ? Math.floor((Date.now() - u.lastActiveAt.getTime()) / 86_400_000)
        : daysSinceSignup;

      let inviteStatus: BetaUserRow["inviteStatus"] = "active";
      if (daysSinceSignup <= 7) inviteStatus = "new";
      else if (daysSinceActive > 14) inviteStatus = "dormant";

      return {
        userId: u.id,
        email: u.email,
        name: u.name,
        sessions: sessionMap.get(u.id) ?? 0,
        events: row._count.id,
        feedbackCount: feedbackMap.get(u.id) ?? 0,
        lastActive: u.lastActiveAt?.toISOString() ?? null,
        registeredAt: u.createdAt.toISOString(),
        inviteStatus,
      };
    })
    .filter((r): r is BetaUserRow => r != null);

  return {
    users: rows,
    totals: {
      feedback: feedbackTotal,
      featureRequests,
      bugReports,
    },
  };
}

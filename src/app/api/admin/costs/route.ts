import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { getCacheStats } from "@/lib/ai/cache";
import { getCostDashboardStats } from "@/lib/ai/usage";

export const dynamic = "force-dynamic";

async function requireAdmin(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
  if (!user?.isAdmin) return false;
  return true;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed =
    (await requireAdmin(session.user.id)) ||
    session.user.email === process.env.ADMIN_EMAIL;
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const [costs, cache, dau] = await Promise.all([
    getCostDashboardStats(since),
    getCacheStats(since),
    prisma.analyticsEvent.groupBy({
      by: ["userId"],
      where: { event: "today_dashboard_viewed", createdAt: { gte: since } },
    }),
  ]);

  return NextResponse.json({
    today: costs,
    cache,
    dailyActiveUsers: dau.length,
  });
}

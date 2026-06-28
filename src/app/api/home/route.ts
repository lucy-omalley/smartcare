import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getOrCreateDailyBrief, getHomeSupplementaryData } from "@/lib/services/daily-brief";

/** @deprecated Use /api/daily-brief — kept for backward compatibility */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const [brief, supplementary] = await Promise.all([
    getOrCreateDailyBrief(userId),
    getHomeSupplementaryData(userId),
  ]);

  return NextResponse.json({
    todaysFocus: brief.greeting,
    parentingTip: brief.tip.content,
    memoryCount: 0,
    postCount: 0,
    upcomingMeetups: supplementary.meetups.length,
    lastConversation: null,
    profile: supplementary.profile,
    brief,
  });
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getTodayPageData } from "@/lib/services/today-page";
import { warmTodayStoryAudio } from "@/lib/services/story-audio-cache";
import { defaultDailyBrief } from "@/lib/services/mumbot";
import { normalizeBriefContent } from "@/lib/today-plan-utils";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Fast Today dashboard payload — brief + profile only. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { brief, profile, generating, briefUpdatedAt, planRefreshing } = await getTodayPageData(session.user.id);
    warmTodayStoryAudio(session.user.id);
    return NextResponse.json({
      brief,
      profile,
      generating: generating ?? false,
      briefUpdatedAt,
      planRefreshing: planRefreshing ?? false,
    });
  } catch (error) {
    console.error("Today GET error:", error);
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          name: true,
          childNickname: true,
          childAge: true,
          parentingGoals: true,
          priorityGoal: true,
          currentChallenges: true,
        },
      });
      const brief = normalizeBriefContent(defaultDailyBrief(user ?? {}));
      return NextResponse.json({
        brief,
        profile: user ?? { name: "there" },
        generating: false,
        fallback: true,
      });
    } catch (fallbackError) {
      console.error("Today GET fallback error:", fallbackError);
      const message = error instanceof Error ? error.message : "Failed to load today";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
}

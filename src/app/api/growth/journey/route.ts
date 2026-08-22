import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getGrowthJourneyView } from "@/lib/growth-journey/aggregator";
import { persistAnalyticsEvent } from "@/lib/analytics/persist";
import { awaitTodayPlanGeneration } from "@/lib/services/daily-brief";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const shouldRefresh = request.nextUrl.searchParams.get("refresh") === "1";
    if (shouldRefresh) {
      await awaitTodayPlanGeneration(session.user.id, { profileRefresh: true });
    }

    const journey = await getGrowthJourneyView(session.user.id);
    await persistAnalyticsEvent("growth_journey_viewed", session.user.id, {
      profile_refresh: shouldRefresh,
    });
    return NextResponse.json({ journey });
  } catch (error) {
    console.error("Growth journey error:", error);
    return NextResponse.json({ error: "Failed to load growth journey" }, { status: 500 });
  }
}

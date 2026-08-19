import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getGrowthJourneyView } from "@/lib/growth-journey/aggregator";
import { persistAnalyticsEvent } from "@/lib/analytics/persist";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const journey = await getGrowthJourneyView(session.user.id);
    await persistAnalyticsEvent("growth_journey_viewed", session.user.id);
    return NextResponse.json({ journey });
  } catch (error) {
    console.error("Growth journey error:", error);
    return NextResponse.json({ error: "Failed to load growth journey" }, { status: 500 });
  }
}

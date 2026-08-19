import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getFamilyAdventuresView } from "@/lib/family-adventures/service";
import { persistAnalyticsEvent } from "@/lib/analytics/persist";
import type { AdventureFilters } from "@/lib/family-adventures/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const filters: AdventureFilters = {
      freeOnly: searchParams.get("free") === "1",
      indoor: searchParams.get("indoor") === "1",
      outdoor: searchParams.get("outdoor") === "1",
      wheelchair: searchParams.get("wheelchair") === "1",
      babyFriendly: searchParams.get("baby") === "1",
      collectionId: searchParams.get("collection") ?? undefined,
      maxDistanceKm: searchParams.get("distance") ? Number(searchParams.get("distance")) : undefined,
    };

    const view = await getFamilyAdventuresView(session.user.id, filters);
    try {
      await persistAnalyticsEvent("family_adventures_viewed", session.user.id);
    } catch (analyticsError) {
      console.warn("Family adventures analytics skipped:", analyticsError);
    }
    return NextResponse.json({ view });
  } catch (error) {
    console.error("Family adventures error:", error);
    const message = error instanceof Error ? error.message : "Failed to load adventures";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

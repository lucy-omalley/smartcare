import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  getFamilyAdventureDetail,
  markAdventureAttended,
  saveFamilyAdventure,
  unsaveFamilyAdventure,
} from "@/lib/family-adventures/service";
import { persistAnalyticsEvent } from "@/lib/analytics/persist";

export const dynamic = "force-dynamic";

type RouteParams = { params: { id: string } };

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const detail = await getFamilyAdventureDetail(session.user.id, params.id);
    if (!detail) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await persistAnalyticsEvent("family_adventure_detail_viewed", session.user.id, {
      adventureId: params.id,
    });
    return NextResponse.json(detail);
  } catch (error) {
    console.error("Family adventure detail error:", error);
    return NextResponse.json({ error: "Failed to load adventure" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { action?: string; note?: string };
    const action = body.action ?? "save";

    if (action === "save") {
      await saveFamilyAdventure(session.user.id, params.id);
      await persistAnalyticsEvent("family_adventure_saved", session.user.id, { adventureId: params.id });
      return NextResponse.json({ saved: true });
    }

    if (action === "unsave") {
      await unsaveFamilyAdventure(session.user.id, params.id);
      return NextResponse.json({ saved: false });
    }

    if (action === "attend") {
      const adventure = await markAdventureAttended(session.user.id, params.id, body.note);
      await persistAnalyticsEvent("family_adventure_attended", session.user.id, {
        adventureId: params.id,
        title: adventure.title,
      });
      return NextResponse.json({ attended: true });
    }

    if (action === "booking") {
      await persistAnalyticsEvent("family_adventure_booking_clicked", session.user.id, {
        adventureId: params.id,
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Family adventure action error:", error);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}

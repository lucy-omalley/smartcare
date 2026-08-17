import { NextResponse } from "next/server";
import { requireAiSession, aiGuardErrorResponse } from "@/lib/auth/session-guards";
import { mapAiRouteError } from "@/lib/ai/route-errors";
import { addToyActivityToTodayPlan } from "@/lib/services/toy-brain-generator";
import { persistAnalyticsEvent } from "@/lib/analytics/persist";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function POST(request: Request, { params }: RouteContext) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
  }

  try {
    const body = await request.json();
    const activityId = String(body.activityId ?? "");
    if (!activityId) {
      return NextResponse.json({ error: "activityId is required." }, { status: 400 });
    }

    const result = await addToyActivityToTodayPlan(guard.userId, params.id, activityId);
    if (!result) return NextResponse.json({ error: "Toy not found." }, { status: 404 });

    await persistAnalyticsEvent("toy_brain_added_to_today", guard.userId, {
      toyId: params.id,
      activityId,
      activityTitle: result.play.title,
    });

    return NextResponse.json(result);
  } catch (error) {
    const mapped = mapAiRouteError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}

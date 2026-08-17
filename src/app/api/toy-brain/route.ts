import { NextResponse } from "next/server";
import { requireAiSession, aiGuardErrorResponse } from "@/lib/auth/session-guards";
import { mapAiRouteError } from "@/lib/ai/route-errors";
import { createManualToy, listToyProfiles } from "@/lib/services/toy-brain-generator";
import { persistAnalyticsEvent } from "@/lib/analytics/persist";
import type { ToyCategory } from "@prisma/client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
  }

  const toys = await listToyProfiles(guard.userId);
  return NextResponse.json({ toys });
}

export async function POST(request: Request) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
  }

  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Toy name is required." }, { status: 400 });
    }

    const toy = await createManualToy({
      userId: guard.userId,
      name,
      category: (body.category as ToyCategory) ?? "UNKNOWN",
      useAi: body.useAi !== false,
    });

    await persistAnalyticsEvent("toy_brain_manual_added", guard.userId, {
      toyId: toy.id,
      category: toy.category,
    });

    return NextResponse.json({ toy });
  } catch (error) {
    const mapped = mapAiRouteError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}

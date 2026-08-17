import { NextResponse } from "next/server";
import { requireAiSession, aiGuardErrorResponse } from "@/lib/auth/session-guards";
import { mapAiRouteError } from "@/lib/ai/route-errors";
import {
  confirmToyIdentification,
  deleteToyProfile,
  getToyProfile,
  regenerateToyActivities,
  updateToyProfile,
} from "@/lib/services/toy-brain-generator";
import { persistAnalyticsEvent } from "@/lib/analytics/persist";
import type { ToyCategory } from "@prisma/client";
import type { ToyPlayActivity } from "@/types/toy-brain";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
  }

  const toy = await getToyProfile(guard.userId, params.id);
  if (!toy) return NextResponse.json({ error: "Toy not found." }, { status: 404 });
  return NextResponse.json({ toy });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
  }

  try {
    const body = await request.json();

    if (body.confirm !== undefined) {
      const toy = await confirmToyIdentification(guard.userId, params.id, {
        name: body.name,
        category: body.category as ToyCategory | undefined,
        confirmed: Boolean(body.confirm),
      });
      if (!toy) return NextResponse.json({ error: "Toy not found." }, { status: 404 });
      await persistAnalyticsEvent("toy_brain_confirmed", guard.userId, { toyId: params.id });
      return NextResponse.json({ toy });
    }

    if (body.regenerateActivities) {
      const toy = await regenerateToyActivities(guard.userId, params.id);
      if (!toy) return NextResponse.json({ error: "Toy not found." }, { status: 404 });
      return NextResponse.json({ toy });
    }

    const toy = await updateToyProfile(guard.userId, params.id, {
      name: body.name,
      category: body.category as ToyCategory | undefined,
      isFavourite: body.isFavourite,
      activities: body.activities as ToyPlayActivity[] | undefined,
    });

    if (!toy) return NextResponse.json({ error: "Toy not found." }, { status: 404 });
    await persistAnalyticsEvent("toy_brain_updated", guard.userId, { toyId: params.id });
    return NextResponse.json({ toy });
  } catch (error) {
    const mapped = mapAiRouteError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
  }

  await deleteToyProfile(guard.userId, params.id);
  await persistAnalyticsEvent("toy_brain_deleted", guard.userId, { toyId: params.id });
  return NextResponse.json({ ok: true });
}

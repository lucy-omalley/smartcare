import { NextResponse } from "next/server";
import { requireAiSession, aiGuardErrorResponse } from "@/lib/auth/session-guards";
import { mapAiRouteError } from "@/lib/ai/route-errors";
import {
  deleteAdventureJourney,
  getAdventureJourney,
  updateAdventureJourney,
} from "@/lib/services/adventure-generator";
import { persistAnalyticsEvent } from "@/lib/analytics/persist";
import type {
  AdventureFormat,
  PosterCategory,
  PosterLayout,
  PosterQrTarget,
  PosterTheme,
  StoryTheme,
} from "@prisma/client";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
  }

  const poster = await getAdventureJourney(guard.userId, params.id);
  if (!poster) return NextResponse.json({ error: "Adventure not found." }, { status: 404 });
  return NextResponse.json({ poster });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
  }

  try {
    const body = await request.json();
    const poster = await updateAdventureJourney(guard.userId, params.id, {
      title: body.title,
      routineGoal: body.routineGoal,
      characterName: body.characterName,
      storyIntro: body.storyIntro,
      storyEnding: body.storyEnding,
      storyTheme: body.storyTheme as StoryTheme | undefined,
      adventureFormat: body.adventureFormat as AdventureFormat | undefined,
      theme: body.theme as PosterTheme | undefined,
      favouriteColours: body.favouriteColours,
      numberOfChildren: body.numberOfChildren,
      layout: body.layout as PosterLayout | undefined,
      category: body.category as PosterCategory | undefined,
      celebrationText: body.celebrationText,
      parentSignature: body.parentSignature,
      rewardEnabled: body.rewardEnabled,
      stickerSpaceEnabled: body.stickerSpaceEnabled,
      qrTarget: body.qrTarget as PosterQrTarget | undefined,
      pages: body.pages,
      steps: body.steps,
    });

    if (!poster) return NextResponse.json({ error: "Adventure not found." }, { status: 404 });

    await persistAnalyticsEvent("adventure_edited", guard.userId, { adventureId: params.id });
    await persistAnalyticsEvent("poster_edited", guard.userId, { posterId: params.id });
    return NextResponse.json({ poster });
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

  await deleteAdventureJourney(guard.userId, params.id);
  await persistAnalyticsEvent("adventure_deleted", guard.userId, { adventureId: params.id });
  return NextResponse.json({ ok: true });
}

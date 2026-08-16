import { NextResponse } from "next/server";
import { requireAiSession, aiGuardErrorResponse } from "@/lib/auth/session-guards";
import { mapAiRouteError } from "@/lib/ai/route-errors";
import {
  createPosterFromTemplate,
  generateRoutinePoster,
  listRoutinePosters,
} from "@/lib/services/poster-generator";
import { persistAnalyticsEvent } from "@/lib/analytics/persist";
import type { GeneratePosterInput } from "@/types/routine-poster";
import type {
  PosterParentGoal,
  PosterTheme,
  RoutineChallenge,
  RoutineLength,
  RoutineTemplateType,
} from "@prisma/client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
  }

  const posters = await listRoutinePosters(guard.userId);
  return NextResponse.json({ posters });
}

export async function POST(request: Request) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
  }

  try {
    const body = await request.json();
    const input: GeneratePosterInput = {
      userId: guard.userId,
      templateType: body.templateType as RoutineTemplateType,
      childName: String(body.childName ?? "").trim(),
      childAge: body.childAge ?? null,
      childGender: body.childGender ?? null,
      theme: (body.theme as PosterTheme) ?? "DINOSAUR",
      favouriteColours: Array.isArray(body.favouriteColours) ? body.favouriteColours.map(String) : [],
      challenge: body.challenge as RoutineChallenge,
      length: (body.length as RoutineLength) ?? "MEDIUM",
      parentGoals: Array.isArray(body.parentGoals) ? (body.parentGoals as PosterParentGoal[]) : [],
      category: body.category,
      layout: body.layout,
      rewardEnabled: body.rewardEnabled !== false,
      stickerSpaceEnabled: body.stickerSpaceEnabled !== false,
      parentSignature: body.parentSignature ?? null,
      qrTarget: body.qrTarget,
    };

    if (!input.childName) {
      return NextResponse.json({ error: "Child name is required." }, { status: 400 });
    }

    const useAi = body.useAi !== false;
    const poster = useAi ? await generateRoutinePoster(input) : await createPosterFromTemplate(input);

    await persistAnalyticsEvent("poster_created", guard.userId, {
      templateType: input.templateType,
      theme: input.theme,
      useAi,
      stepCount: poster.steps.length,
    });

    return NextResponse.json({ poster });
  } catch (error) {
    const mapped = mapAiRouteError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}

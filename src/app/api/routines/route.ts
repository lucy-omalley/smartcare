import { NextResponse } from "next/server";
import { requireAiSession, aiGuardErrorResponse } from "@/lib/auth/session-guards";
import { mapAiRouteError } from "@/lib/ai/route-errors";
import { listVisualRoutines, generateVisualRoutine, createRoutineFromTemplate } from "@/lib/services/routine-generator";
import { persistAnalyticsEvent } from "@/lib/analytics/persist";
import type { GenerateRoutineInput } from "@/types/visual-routine";
import type { RoutineChallenge, RoutineLength, RoutineTemplateType } from "@prisma/client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
  }

  const routines = await listVisualRoutines(guard.userId);
  return NextResponse.json({ routines });
}

export async function POST(request: Request) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
  }

  try {
    const body = await request.json();
    const input: GenerateRoutineInput = {
      userId: guard.userId,
      templateType: body.templateType as RoutineTemplateType,
      childName: String(body.childName ?? "").trim(),
      childAge: body.childAge ?? null,
      interests: Array.isArray(body.interests) ? body.interests.map(String) : [],
      challenge: body.challenge as RoutineChallenge,
      length: (body.length as RoutineLength) ?? "MEDIUM",
      rewardsEnabled: body.rewardsEnabled !== false,
    };

    if (!input.childName) {
      return NextResponse.json({ error: "Child name is required." }, { status: 400 });
    }

    const useAi = body.useAi !== false;
    const routine = useAi
      ? await generateVisualRoutine(input)
      : await createRoutineFromTemplate(input);

    await persistAnalyticsEvent("routine_created", guard.userId, {
      templateType: input.templateType,
      useAi,
      stepCount: routine.steps.length,
    });

    return NextResponse.json({ routine });
  } catch (error) {
    const mapped = mapAiRouteError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}

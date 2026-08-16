import { NextResponse } from "next/server";
import { requireAiSession, aiGuardErrorResponse } from "@/lib/auth/session-guards";
import { recordRoutineCompletion } from "@/lib/services/routine-library";
import { persistAnalyticsEvent } from "@/lib/analytics/persist";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
  }

  const body = await request.json();
  const stepsCompleted = Number(body.stepsCompleted ?? 0);
  const stepsTotal = Number(body.stepsTotal ?? 0);
  const durationSeconds = body.durationSeconds != null ? Number(body.durationSeconds) : undefined;
  const skippedStepIds = Array.isArray(body.skippedStepIds) ? body.skippedStepIds.map(String) : [];
  const completed = body.completed !== false;

  await recordRoutineCompletion({
    userId: guard.userId,
    routineId: params.id,
    stepsCompleted,
    stepsTotal,
    durationSeconds,
    skippedStepIds,
    completed,
  });

  await persistAnalyticsEvent(completed ? "routine_completed" : "routine_step_skipped", guard.userId, {
    routineId: params.id,
    stepsCompleted,
    stepsTotal,
  });

  return NextResponse.json({ ok: true });
}

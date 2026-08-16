import { NextResponse } from "next/server";
import { requireAiSession, aiGuardErrorResponse } from "@/lib/auth/session-guards";
import { getRoutineDashboard, suggestRoutineForNow } from "@/lib/services/routine-library";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
  }

  const [dashboard, suggestion] = await Promise.all([
    getRoutineDashboard(guard.userId),
    suggestRoutineForNow(guard.userId),
  ]);

  return NextResponse.json({ dashboard, suggestion });
}

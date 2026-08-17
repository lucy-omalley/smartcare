import { NextResponse } from "next/server";
import { requireAiSession, aiGuardErrorResponse } from "@/lib/auth/session-guards";
import { getToyRecommendations } from "@/lib/services/toy-brain-generator";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
  }

  const tips = await getToyRecommendations(guard.userId);
  return NextResponse.json({ tips });
}

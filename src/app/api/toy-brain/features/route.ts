import { NextResponse } from "next/server";
import { requireAiSession, aiGuardErrorResponse } from "@/lib/auth/session-guards";
import { getToyBrainFeatures } from "@/lib/toy-brain/gating";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
  }

  const features = await getToyBrainFeatures(guard.userId);
  return NextResponse.json({ features });
}

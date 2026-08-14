import { NextResponse } from "next/server";
import { requireAiSession } from "@/lib/auth/session-guards";
import { processVoiceProfile } from "@/lib/services/voice-profile-service";
import { assertVoiceRateLimit, recordVoiceOperation } from "@/lib/rate-limit-voice";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    await assertVoiceRateLimit(guard.userId);
    const profile = await processVoiceProfile(guard.userId, params.id);
    await recordVoiceOperation(guard.userId, { action: "process", profileId: params.id });
    return NextResponse.json({ profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Processing failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

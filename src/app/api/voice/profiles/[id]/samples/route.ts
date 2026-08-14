import { NextResponse } from "next/server";
import { requireAiSession } from "@/lib/auth/session-guards";
import { saveVoiceSample } from "@/lib/services/voice-profile-service";
import { assertVoiceRateLimit, recordVoiceOperation } from "@/lib/rate-limit-voice";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    await assertVoiceRateLimit(guard.userId);

    const form = await request.formData();
    const paragraphIndex = Number(form.get("paragraphIndex"));
    const durationMs = form.get("durationMs") ? Number(form.get("durationMs")) : undefined;
    const file = form.get("audio");

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "Audio file required" }, { status: 400 });
    }

    const audio = Buffer.from(await file.arrayBuffer());
    const result = await saveVoiceSample({
      userId: guard.userId,
      voiceProfileId: params.id,
      paragraphIndex,
      audio,
      mimeType: file.type || "audio/webm",
      durationMs,
    });

    await recordVoiceOperation(guard.userId, { action: "sample_upload", profileId: params.id });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

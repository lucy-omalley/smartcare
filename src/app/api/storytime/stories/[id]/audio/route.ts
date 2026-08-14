import { NextResponse } from "next/server";
import { requireAiSession } from "@/lib/auth/session-guards";
import { getOrGenerateFamilyStoryAudio } from "@/lib/services/voice-profile-service";
import { assertVoiceRateLimit, recordVoiceOperation } from "@/lib/rate-limit-voice";
import { persistAnalyticsEvent } from "@/lib/analytics/persist";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { searchParams } = new URL(request.url);
  const voiceProfileId = searchParams.get("voiceProfileId");

  try {
    await assertVoiceRateLimit(guard.userId);
    const { buffer, narratorType } = await getOrGenerateFamilyStoryAudio({
      userId: guard.userId,
      storyId: params.id,
      voiceProfileId,
    });

    await recordVoiceOperation(guard.userId, {
      action: "narrate",
      storyId: params.id,
      narratorType,
    });

    await persistAnalyticsEvent("family_story_narrated", guard.userId, {
      storyId: params.id,
      narratorType,
      voiceProfileId,
    });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Narration failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

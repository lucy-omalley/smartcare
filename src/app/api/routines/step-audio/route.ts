import { NextResponse } from "next/server";
import { requireAiSession, aiGuardErrorResponse } from "@/lib/auth/session-guards";
import { getConfiguredVoiceProviderId } from "@/lib/voice/voice-service";
import { getVoiceProvider } from "@/lib/voice/voice-service";
import { STANDARD_NARRATOR_VOICE } from "@/lib/voice/providers/openai-preset-provider";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
  }

  const body = await request.json();
  const text = String(body.text ?? "").trim();
  const voiceProfileId = body.voiceProfileId as string | undefined;

  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  let providerId = getConfiguredVoiceProviderId();
  let providerVoiceId = `openai:${STANDARD_NARRATOR_VOICE}:standard`;

  if (voiceProfileId) {
    const profile = await prisma.voiceProfile.findFirst({
      where: { id: voiceProfileId, userId: guard.userId, status: "READY", deletedAt: null },
    });
    if (profile?.providerVoiceId) {
      providerId = profile.provider as "openai" | "elevenlabs";
      providerVoiceId = profile.providerVoiceId;
    }
  }

  const provider = getVoiceProvider(providerId);
  const buffer = await provider.synthesizeSpeech({
    text: text.slice(0, 500),
    provider: providerId,
    providerVoiceId,
  });

  return new NextResponse(buffer, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=86400" },
  });
}

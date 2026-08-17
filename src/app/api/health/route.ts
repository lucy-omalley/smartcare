import { NextResponse } from "next/server";
import { checkElevenLabsApiKey } from "@/lib/voice/elevenlabs-api-key";
import { getConfiguredVoiceProviderId } from "@/lib/voice/voice-service";

export const dynamic = "force-dynamic";

/** Minimal liveness probe — safe to expose publicly. */
export async function GET() {
  const voiceProviderConfigured = getConfiguredVoiceProviderId();
  const elevenlabsKeyStatus =
    voiceProviderConfigured === "elevenlabs" ? await checkElevenLabsApiKey() : "missing";

  return NextResponse.json({
    ok: true,
    service: "parenfy",
    timestamp: new Date().toISOString(),
    voiceProviderConfigured,
    elevenlabsKeyStatus,
  });
}

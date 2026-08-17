import { NextResponse } from "next/server";
import { getConfiguredVoiceProviderId } from "@/lib/voice/voice-service";

export const dynamic = "force-dynamic";

/** Minimal liveness probe — safe to expose publicly. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "parenfy",
    timestamp: new Date().toISOString(),
    voiceProviderConfigured: getConfiguredVoiceProviderId(),
  });
}

import "server-only";

import type { VoiceProvider, VoiceProviderId } from "@/lib/voice/types";
import { OpenAIPresetVoiceProvider } from "@/lib/voice/providers/openai-preset-provider";
import { ElevenLabsVoiceProvider } from "@/lib/voice/providers/elevenlabs-provider";

const providers: Record<VoiceProviderId, VoiceProvider> = {
  openai: new OpenAIPresetVoiceProvider(),
  elevenlabs: new ElevenLabsVoiceProvider(),
};

export function getConfiguredVoiceProviderId(): VoiceProviderId {
  if (process.env.ELEVENLABS_API_KEY?.trim()) return "elevenlabs";
  return "openai";
}

export function getVoiceProvider(id?: VoiceProviderId): VoiceProvider {
  const providerId = id ?? getConfiguredVoiceProviderId();
  return providers[providerId];
}

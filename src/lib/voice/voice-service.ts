import "server-only";

import type { VoiceProvider, VoiceProviderId } from "@/lib/voice/types";
import { OpenAIPresetVoiceProvider } from "@/lib/voice/providers/openai-preset-provider";
import { ElevenLabsVoiceProvider } from "@/lib/voice/providers/elevenlabs-provider";
import { normalizeElevenLabsApiKey } from "@/lib/voice/elevenlabs-api-key";

const providers: Record<VoiceProviderId, VoiceProvider> = {
  openai: new OpenAIPresetVoiceProvider(),
  elevenlabs: new ElevenLabsVoiceProvider(),
};

export function getConfiguredVoiceProviderId(): VoiceProviderId {
  if (normalizeElevenLabsApiKey(process.env.ELEVENLABS_API_KEY)) return "elevenlabs";
  return "openai";
}

export function getVoiceProvider(id?: VoiceProviderId): VoiceProvider {
  const providerId = id ?? getConfiguredVoiceProviderId();
  return providers[providerId];
}

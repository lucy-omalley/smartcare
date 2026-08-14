import type { VoiceRelationship } from "@prisma/client";

export type VoiceProviderId = "openai" | "elevenlabs";

export interface VoiceCloneInput {
  profileId: string;
  name: string;
  relationship: VoiceRelationship;
  samples: Array<{ index: number; audio: Buffer; mimeType: string }>;
}

export interface VoiceCloneResult {
  provider: VoiceProviderId;
  providerVoiceId: string;
}

export interface VoiceSynthesisInput {
  text: string;
  providerVoiceId: string;
  provider: VoiceProviderId;
}

export interface VoiceProvider {
  id: VoiceProviderId;
  cloneVoice(input: VoiceCloneInput): Promise<VoiceCloneResult>;
  synthesizeSpeech(input: VoiceSynthesisInput): Promise<Buffer>;
  deleteVoice(providerVoiceId: string): Promise<void>;
}

export const CONSENT_VERSION = "family-voice-v1";

export const CONSENT_TEXT =
  "I understand my voice will be used only to generate bedtime stories for my family on Parenfy. My recordings are encrypted, never shared publicly, and I can delete them at any time.";

import "server-only";

import OpenAI from "openai";
import type { VoiceRelationship } from "@prisma/client";
import type { VoiceCloneInput, VoiceCloneResult, VoiceProvider, VoiceSynthesisInput } from "@/lib/voice/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** OpenAI TTS preset voice names */
type OpenAIVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

/** Warm default narrator — intentionally distinct from relationship family presets. */
export const STANDARD_NARRATOR_VOICE: OpenAIVoice = "fable";

const RELATIONSHIP_VOICES: Record<VoiceRelationship, OpenAIVoice> = {
  MUM: "nova",
  DAD: "onyx",
  GRANDMA: "shimmer",
  GRANDAD: "echo",
  GUARDIAN: "alloy",
  OTHER: "alloy",
};

export function parseOpenAIVoice(providerVoiceId: string, fallback: OpenAIVoice = "nova"): OpenAIVoice {
  const voicePart = providerVoiceId.split(":")[1];
  const allowed: OpenAIVoice[] = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
  return allowed.includes(voicePart as OpenAIVoice) ? (voicePart as OpenAIVoice) : fallback;
}

export class OpenAIPresetVoiceProvider implements VoiceProvider {
  id = "openai" as const;

  async cloneVoice(input: VoiceCloneInput): Promise<VoiceCloneResult> {
    // Samples are stored encrypted; provider id maps to relationship preset voice.
    const voice = RELATIONSHIP_VOICES[input.relationship] ?? "nova";
    return {
      provider: "openai",
      providerVoiceId: `openai:${voice}:${input.profileId}`,
    };
  }

  async synthesizeSpeech(input: VoiceSynthesisInput): Promise<Buffer> {
    const voice = parseOpenAIVoice(input.providerVoiceId, "nova");

    const speech = await openai.audio.speech.create({
      model: "tts-1",
      voice,
      input: input.text.trim().slice(0, 4096),
      response_format: "mp3",
    });

    return Buffer.from(await speech.arrayBuffer());
  }

  async deleteVoice(_providerVoiceId: string): Promise<void> {
    // OpenAI preset voices are not user-owned — nothing to delete remotely.
  }
}

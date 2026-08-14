import "server-only";

import OpenAI from "openai";
import type { VoiceRelationship } from "@prisma/client";
import type { VoiceCloneInput, VoiceCloneResult, VoiceProvider, VoiceSynthesisInput } from "@/lib/voice/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** OpenAI TTS preset voice names */
type OpenAIVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

const RELATIONSHIP_VOICES: Record<VoiceRelationship, OpenAIVoice> = {
  MUM: "nova",
  DAD: "onyx",
  GRANDMA: "shimmer",
  GRANDAD: "echo",
  GUARDIAN: "fable",
  OTHER: "alloy",
};

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
    const voicePart = input.providerVoiceId.split(":")[1] ?? "nova";
    const voice = voicePart as OpenAIVoice;

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

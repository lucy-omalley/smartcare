import "server-only";

import type { VoiceCloneInput, VoiceCloneResult, VoiceProvider, VoiceSynthesisInput } from "@/lib/voice/types";

const BASE = "https://api.elevenlabs.io/v1";

function apiKey(): string {
  const key = process.env.ELEVENLABS_API_KEY?.trim();
  if (!key) throw new Error("ELEVENLABS_API_KEY is not configured");
  return key;
}

export class ElevenLabsVoiceProvider implements VoiceProvider {
  id = "elevenlabs" as const;

  async cloneVoice(input: VoiceCloneInput): Promise<VoiceCloneResult> {
    const form = new FormData();
    form.append("name", `${input.name} (${input.profileId.slice(0, 8)})`);
    form.append("description", `Parenfy family voice — ${input.relationship}`);

    for (const sample of input.samples) {
      const blob = new Blob([sample.audio], { type: sample.mimeType });
      form.append("files", blob, `sample-${sample.index}.webm`);
    }

    const res = await fetch(`${BASE}/voices/add`, {
      method: "POST",
      headers: { "xi-api-key": apiKey() },
      body: form,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`ElevenLabs voice clone failed: ${err.slice(0, 200)}`);
    }

    const data = (await res.json()) as { voice_id: string };
    return { provider: "elevenlabs", providerVoiceId: data.voice_id };
  }

  async synthesizeSpeech(input: VoiceSynthesisInput): Promise<Buffer> {
    const res = await fetch(`${BASE}/text-to-speech/${input.providerVoiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey(),
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: input.text.trim().slice(0, 5000),
        model_id: process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`ElevenLabs TTS failed: ${err.slice(0, 200)}`);
    }

    return Buffer.from(await res.arrayBuffer());
  }

  async deleteVoice(providerVoiceId: string): Promise<void> {
    const res = await fetch(`${BASE}/voices/${providerVoiceId}`, {
      method: "DELETE",
      headers: { "xi-api-key": apiKey() },
    });
    if (!res.ok && res.status !== 404) {
      throw new Error("Failed to delete ElevenLabs voice");
    }
  }
}

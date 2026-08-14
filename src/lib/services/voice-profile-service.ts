import "server-only";

import { createHash } from "crypto";
import type { NarratorType, VoiceRelationship } from "@prisma/client";
import { prisma } from "@/lib/db";
import { decryptVoiceBuffer, encryptVoiceBuffer } from "@/lib/voice/encryption";
import { getConfiguredVoiceProviderId, getVoiceProvider } from "@/lib/voice/voice-service";
import { CONSENT_VERSION } from "@/lib/voice/types";
import { assertCanUseFamilyVoice } from "@/lib/storytime/gating";
import { logAIRequest } from "@/lib/ai/usage";
import { VOICE_RECORDING_PARAGRAPH_COUNT } from "@/lib/voice/recording-script";

const inflight = new Map<string, Promise<Buffer>>();

export function buildNarratorKey(voiceProfileId: string | null): string {
  return voiceProfileId ?? "standard";
}

function audioHash(storyText: string, key: string): string {
  return createHash("sha256").update(`${key}:${storyText}`).digest("hex");
}

export async function getOrGenerateFamilyStoryAudio(params: {
  userId: string;
  storyId: string;
  voiceProfileId?: string | null;
}): Promise<{ buffer: Buffer; narratorType: NarratorType; narratorKey: string }> {
  const story = await prisma.familyStory.findFirst({
    where: { id: params.storyId, userId: params.userId },
  });
  if (!story) throw new Error("Story not found");

  const voiceProfileId = params.voiceProfileId ?? null;
  const narratorType: NarratorType = voiceProfileId ? "FAMILY_VOICE" : "STANDARD";
  const key = buildNarratorKey(voiceProfileId);
  const hash = audioHash(story.story, key);

  const existing = await prisma.storyNarration.findUnique({
    where: { storyId_narratorKey: { storyId: story.id, narratorKey: key } },
  });

  if (existing?.audioData && existing.audioHash === hash) {
    await logAIRequest({ userId: params.userId, feature: "VOICE_NARRATION", resolution: "DB_ONLY" });
    return { buffer: Buffer.from(existing.audioData), narratorType, narratorKey: key };
  }

  const inflightKey = `${story.id}:${key}`;
  const pending = inflight.get(inflightKey);
  if (pending) {
    const buffer = await pending;
    return { buffer, narratorType, narratorKey: key };
  }

  const task = synthesizeAndCache({
    userId: params.userId,
    storyId: story.id,
    storyText: story.story,
    voiceProfileId,
    narratorType,
    narratorKey: key,
    hash,
  });

  inflight.set(inflightKey, task);
  try {
    const buffer = await task;
    return { buffer, narratorType, narratorKey: key };
  } finally {
    inflight.delete(inflightKey);
  }
}

async function synthesizeAndCache(args: {
  userId: string;
  storyId: string;
  storyText: string;
  voiceProfileId: string | null;
  narratorType: NarratorType;
  narratorKey: string;
  hash: string;
}): Promise<Buffer> {
  let providerId = getConfiguredVoiceProviderId();
  let providerVoiceId = "openai:nova:standard";

  if (args.voiceProfileId) {
    await assertCanUseFamilyVoice(args.userId);
    const profile = await prisma.voiceProfile.findFirst({
      where: {
        id: args.voiceProfileId,
        userId: args.userId,
        status: "READY",
        deletedAt: null,
      },
    });
    if (!profile?.providerVoiceId) throw new Error("Voice profile not ready");
    providerId = profile.provider as "openai" | "elevenlabs";
    providerVoiceId = profile.providerVoiceId;
  } else {
    providerId = "openai";
    providerVoiceId = "openai:nova:standard";
  }

  const provider = getVoiceProvider(providerId);
  const buffer = await provider.synthesizeSpeech({
    text: args.storyText,
    provider: providerId,
    providerVoiceId,
  });

  await logAIRequest({ userId: args.userId, feature: "VOICE_NARRATION", resolution: "LLM" });

  await prisma.storyNarration.upsert({
    where: { storyId_narratorKey: { storyId: args.storyId, narratorKey: args.narratorKey } },
    create: {
      storyId: args.storyId,
      voiceProfileId: args.voiceProfileId,
      narratorType: args.narratorType,
      narratorKey: args.narratorKey,
      audioData: buffer,
      audioHash: args.hash,
    },
    update: {
      audioData: buffer,
      audioHash: args.hash,
      voiceProfileId: args.voiceProfileId,
      narratorType: args.narratorType,
    },
  });

  return buffer;
}

export async function listVoiceProfiles(userId: string) {
  return prisma.voiceProfile.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      relationship: true,
      avatarEmoji: true,
      status: true,
      recordingCount: true,
      consentGivenAt: true,
      createdAt: true,
      updatedAt: true,
      processingError: true,
    },
  });
}

export async function createVoiceProfile(params: {
  userId: string;
  name: string;
  relationship: VoiceRelationship;
  avatarEmoji?: string;
  consentGiven: boolean;
}) {
  if (!params.consentGiven) throw new Error("Consent is required to create a voice profile.");

  await assertCanUseFamilyVoice(params.userId);

  return prisma.voiceProfile.create({
    data: {
      userId: params.userId,
      name: params.name.trim(),
      relationship: params.relationship,
      avatarEmoji: params.avatarEmoji ?? "🎙️",
      status: "RECORDING",
      consentGivenAt: new Date(),
      consentVersion: CONSENT_VERSION,
      provider: getConfiguredVoiceProviderId(),
    },
  });
}

export async function saveVoiceSample(params: {
  userId: string;
  voiceProfileId: string;
  paragraphIndex: number;
  audio: Buffer;
  mimeType: string;
  durationMs?: number;
}) {
  const profile = await prisma.voiceProfile.findFirst({
    where: { id: params.voiceProfileId, userId: params.userId, deletedAt: null },
  });
  if (!profile) throw new Error("Voice profile not found");
  if (params.paragraphIndex < 0 || params.paragraphIndex >= VOICE_RECORDING_PARAGRAPH_COUNT) {
    throw new Error("Invalid paragraph index");
  }

  const encrypted = encryptVoiceBuffer(params.audio);

  await prisma.voiceRecordingSample.upsert({
    where: {
      voiceProfileId_paragraphIndex: {
        voiceProfileId: params.voiceProfileId,
        paragraphIndex: params.paragraphIndex,
      },
    },
    create: {
      voiceProfileId: params.voiceProfileId,
      paragraphIndex: params.paragraphIndex,
      encryptedData: encrypted,
      mimeType: params.mimeType,
      durationMs: params.durationMs,
    },
    update: {
      encryptedData: encrypted,
      mimeType: params.mimeType,
      durationMs: params.durationMs,
    },
  });

  const count = await prisma.voiceRecordingSample.count({
    where: { voiceProfileId: params.voiceProfileId },
  });

  await prisma.voiceProfile.update({
    where: { id: params.voiceProfileId },
    data: { recordingCount: count, status: "RECORDING" },
  });

  return { recordingCount: count, required: VOICE_RECORDING_PARAGRAPH_COUNT };
}

export async function processVoiceProfile(userId: string, voiceProfileId: string) {
  const profile = await prisma.voiceProfile.findFirst({
    where: { id: voiceProfileId, userId, deletedAt: null },
    include: { samples: { orderBy: { paragraphIndex: "asc" } } },
  });
  if (!profile) throw new Error("Voice profile not found");
  if (!profile.consentGivenAt) throw new Error("Consent required");
  if (profile.samples.length < Math.min(6, VOICE_RECORDING_PARAGRAPH_COUNT)) {
    throw new Error("Please complete at least 6 recording paragraphs before processing.");
  }

  await prisma.voiceProfile.update({
    where: { id: voiceProfileId },
    data: { status: "PROCESSING", processingError: null },
  });

  try {
    const provider = getVoiceProvider(profile.provider as "openai" | "elevenlabs");
    const samples = profile.samples.map((s) => ({
      index: s.paragraphIndex,
      audio: decryptVoiceBuffer(Buffer.from(s.encryptedData)),
      mimeType: s.mimeType,
    }));

    const cloned = await provider.cloneVoice({
      profileId: profile.id,
      name: profile.name,
      relationship: profile.relationship,
      samples,
    });

    return prisma.voiceProfile.update({
      where: { id: voiceProfileId },
      data: {
        status: "READY",
        provider: cloned.provider,
        providerVoiceId: cloned.providerVoiceId,
        processingError: null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Voice processing failed";
    await prisma.voiceProfile.update({
      where: { id: voiceProfileId },
      data: { status: "FAILED", processingError: message },
    });
    throw error;
  }
}

export async function deleteVoiceProfile(userId: string, voiceProfileId: string) {
  const profile = await prisma.voiceProfile.findFirst({
    where: { id: voiceProfileId, userId, deletedAt: null },
  });
  if (!profile) throw new Error("Voice profile not found");

  if (profile.providerVoiceId && profile.provider === "elevenlabs") {
    try {
      const provider = getVoiceProvider("elevenlabs");
      await provider.deleteVoice(profile.providerVoiceId);
    } catch {
      // Best-effort remote deletion
    }
  }

  await prisma.voiceProfile.update({
    where: { id: voiceProfileId },
    data: { deletedAt: new Date(), status: "FAILED", providerVoiceId: null },
  });

  await prisma.voiceRecordingSample.deleteMany({ where: { voiceProfileId } });
}

export async function saveNarratorPreference(
  userId: string,
  selection: { type: "standard" } | { type: "family"; voiceProfileId: string }
) {
  await prisma.userStorySettings.upsert({
    where: { userId },
    create: {
      userId,
      lastNarratorType: selection.type === "standard" ? "STANDARD" : "FAMILY_VOICE",
      lastNarratorVoiceId: selection.type === "family" ? selection.voiceProfileId : null,
    },
    update: {
      lastNarratorType: selection.type === "standard" ? "STANDARD" : "FAMILY_VOICE",
      lastNarratorVoiceId: selection.type === "family" ? selection.voiceProfileId : null,
    },
  });
}

export async function getNarratorPreference(userId: string) {
  return prisma.userStorySettings.findUnique({ where: { userId } });
}

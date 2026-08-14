import "server-only";

import { prisma } from "@/lib/db";

const WINDOW_MS = 60_000;
const MAX_VOICE_OPS_PER_MINUTE = 8;

export async function assertVoiceRateLimit(userId: string): Promise<void> {
  const since = new Date(Date.now() - WINDOW_MS);
  const count = await prisma.analyticsEvent.count({
    where: {
      userId,
      event: "voice_operation",
      createdAt: { gte: since },
    },
  });
  if (count >= MAX_VOICE_OPS_PER_MINUTE) {
    throw new Error("Too many voice requests. Please wait a moment and try again.");
  }
}

export async function recordVoiceOperation(userId: string, properties?: Record<string, unknown>): Promise<void> {
  await prisma.analyticsEvent.create({
    data: {
      userId,
      event: "voice_operation",
      properties: (properties ?? {}) as object,
    },
  });
}

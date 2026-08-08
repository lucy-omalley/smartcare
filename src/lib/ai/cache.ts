import "server-only";

import type { AIFeature } from "@prisma/client";
import { prisma } from "@/lib/db";

const DEFAULT_TTL_SECONDS = 24 * 60 * 60;

/**
 * Semantic cache — DB-first (Neon). Optional Redis via UPSTASH_REDIS_REST_URL
 * can be wired here without changing callers.
 */
export async function getCachedAIResponse<T>(cacheKey: string): Promise<T | null> {
  const entry = await prisma.aICacheEntry.findUnique({ where: { cacheKey } }).catch(() => null);
  if (!entry || entry.expiresAt <= new Date()) {
    if (entry) {
      await prisma.aICacheEntry.delete({ where: { cacheKey } }).catch(() => {});
    }
    return null;
  }

  await prisma.aICacheEntry
    .update({ where: { cacheKey }, data: { hitCount: { increment: 1 } } })
    .catch(() => {});

  return entry.response as T;
}

export async function setCachedAIResponse(
  cacheKey: string,
  feature: AIFeature,
  response: unknown,
  ttlSeconds = DEFAULT_TTL_SECONDS
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  await prisma.aICacheEntry.upsert({
    where: { cacheKey },
    create: { cacheKey, feature, response: response as object, expiresAt },
    update: { response: response as object, expiresAt, updatedAt: new Date() },
  });
}

export async function getCacheStats(since: Date) {
  const [entries, hits, misses] = await Promise.all([
    prisma.aICacheEntry.count({ where: { createdAt: { gte: since } } }),
    prisma.aIUsageLog.count({ where: { createdAt: { gte: since }, cacheHit: true } }),
    prisma.aIUsageLog.count({ where: { createdAt: { gte: since }, cacheHit: false } }),
  ]);
  const total = hits + misses;
  return {
    entries,
    hits,
    misses,
    hitRate: total > 0 ? hits / total : 0,
  };
}

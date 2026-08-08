import "server-only";

import { Redis } from "@upstash/redis";
import type { AIFeature } from "@prisma/client";
import { prisma } from "@/lib/db";

const DEFAULT_TTL_SECONDS = 24 * 60 * 60;
const REDIS_PREFIX = "ai-cache:";

let redisClient: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redisClient = null;
    return null;
  }
  redisClient = new Redis({ url, token });
  return redisClient;
}

async function getFromRedis<T>(cacheKey: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get<string>(`${REDIS_PREFIX}${cacheKey}`);
    if (!raw) return null;
    return (typeof raw === "string" ? JSON.parse(raw) : raw) as T;
  } catch {
    return null;
  }
}

async function setInRedis(cacheKey: string, response: unknown, ttlSeconds: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(`${REDIS_PREFIX}${cacheKey}`, JSON.stringify(response), { ex: ttlSeconds });
  } catch {
    /* Redis optional — Neon remains source of truth */
  }
}

/**
 * Semantic cache — Redis-first when UPSTASH_REDIS_REST_URL is set, Neon fallback.
 */
export async function getCachedAIResponse<T>(cacheKey: string): Promise<T | null> {
  const fromRedis = await getFromRedis<T>(cacheKey);
  if (fromRedis) {
    await prisma.aICacheEntry
      .update({ where: { cacheKey }, data: { hitCount: { increment: 1 } } })
      .catch(() => {});
    return fromRedis;
  }

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

  const ttlSeconds = Math.max(1, Math.floor((entry.expiresAt.getTime() - Date.now()) / 1000));
  await setInRedis(cacheKey, entry.response, ttlSeconds);

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
  await setInRedis(cacheKey, response, ttlSeconds);
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
    redisEnabled: Boolean(getRedis()),
  };
}

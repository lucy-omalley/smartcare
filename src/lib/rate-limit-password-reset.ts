import "server-only";

import { getUpstashRedis } from "@/lib/upstash";

const PREFIX = "pwd-reset-limit:";
const MAX_ATTEMPTS = 5;
const WINDOW_SEC = 3600; // 1 hour

export async function checkPasswordResetRateLimit(ip: string): Promise<{
  allowed: boolean;
  retryAfterSeconds?: number;
}> {
  const redis = getUpstashRedis();
  if (!redis || ip === "unknown") {
    return { allowed: true };
  }

  const key = `${PREFIX}${ip}`;

  try {
    const count = await redis.get<number>(key);
    const attempts = typeof count === "number" ? count : 0;
    if (attempts >= MAX_ATTEMPTS) {
      return { allowed: false, retryAfterSeconds: WINDOW_SEC };
    }
    return { allowed: true };
  } catch (error) {
    console.error("Password reset rate limit check failed:", error);
    return { allowed: true };
  }
}

export async function recordPasswordResetAttempt(ip: string): Promise<void> {
  const redis = getUpstashRedis();
  if (!redis || ip === "unknown") return;

  const key = `${PREFIX}${ip}`;
  try {
    await redis.incr(key);
    await redis.expire(key, WINDOW_SEC);
  } catch (error) {
    console.error("Password reset rate limit record failed:", error);
  }
}

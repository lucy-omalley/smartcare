import "server-only";

import { getUpstashRedis } from "@/lib/upstash";

const PREFIX = "login-limit:";
const MAX_ATTEMPTS = 10;
const WINDOW_SEC = 900; // 15 minutes

export async function checkLoginRateLimit(ip: string): Promise<{
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
    console.error("Login rate limit check failed:", error);
    return { allowed: true };
  }
}

export async function recordLoginAttempt(ip: string): Promise<void> {
  const redis = getUpstashRedis();
  if (!redis || ip === "unknown") return;

  const key = `${PREFIX}${ip}`;
  try {
    await redis.incr(key);
    await redis.expire(key, WINDOW_SEC);
  } catch (error) {
    console.error("Login rate limit record failed:", error);
  }
}

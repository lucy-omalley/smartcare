import "server-only";

import { getUpstashRedis } from "@/lib/upstash";

const HOURLY_LIMIT = 3;
const DAILY_LIMIT = 10;
const PREFIX = "reg-limit:";

export type RegistrationRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds?: number;
  reason?: "hourly" | "daily";
};

export async function checkRegistrationRateLimit(
  ip: string
): Promise<RegistrationRateLimitResult> {
  const redis = getUpstashRedis();
  if (!redis || ip === "unknown") {
    return { allowed: true };
  }

  const hourKey = `${PREFIX}h:${ip}:${new Date().toISOString().slice(0, 13)}`;
  const dayKey = `${PREFIX}d:${ip}:${new Date().toISOString().slice(0, 10)}`;

  try {
    const [hourly, daily] = await Promise.all([redis.get<number>(hourKey), redis.get<number>(dayKey)]);

    const hourlyCount = typeof hourly === "number" ? hourly : 0;
    const dailyCount = typeof daily === "number" ? daily : 0;

    if (hourlyCount >= HOURLY_LIMIT) {
      return { allowed: false, retryAfterSeconds: 3600, reason: "hourly" };
    }
    if (dailyCount >= DAILY_LIMIT) {
      return { allowed: false, retryAfterSeconds: 86400, reason: "daily" };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Registration rate limit check failed:", error);
    return { allowed: true };
  }
}

export async function recordRegistrationAttempt(ip: string): Promise<void> {
  const redis = getUpstashRedis();
  if (!redis || ip === "unknown") return;

  const hourKey = `${PREFIX}h:${ip}:${new Date().toISOString().slice(0, 13)}`;
  const dayKey = `${PREFIX}d:${ip}:${new Date().toISOString().slice(0, 10)}`;

  try {
    await Promise.all([
      redis.incr(hourKey).then(() => redis.expire(hourKey, 3600)),
      redis.incr(dayKey).then(() => redis.expire(dayKey, 86400)),
    ]);
  } catch (error) {
    console.error("Registration rate limit record failed:", error);
  }
}

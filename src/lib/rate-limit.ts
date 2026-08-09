import { hasUnlimitedUsage } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

const MUMBOT_HOURLY_LIMIT = 15;
const MUMBOT_DAILY_LIMIT = 60;

export type RateLimitResult = {
  allowed: boolean;
  retryAfterMinutes?: number;
};

/** Basic per-user MumBot rate limits using message history. */
export async function checkMumBotRateLimit(userId: string): Promise<RateLimitResult> {
  if (await hasUnlimitedUsage(userId)) {
    return { allowed: true };
  }

  const now = Date.now();
  const oneHourAgo = new Date(now - 60 * 60 * 1000);
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

  const [hourlyCount, dailyCount] = await Promise.all([
    prisma.message.count({
      where: {
        isUser: true,
        createdAt: { gte: oneHourAgo },
        conversation: { userId },
      },
    }),
    prisma.message.count({
      where: {
        isUser: true,
        createdAt: { gte: oneDayAgo },
        conversation: { userId },
      },
    }),
  ]);

  if (hourlyCount >= MUMBOT_HOURLY_LIMIT) {
    return { allowed: false, retryAfterMinutes: 15 };
  }

  if (dailyCount >= MUMBOT_DAILY_LIMIT) {
    return { allowed: false, retryAfterMinutes: 60 };
  }

  return { allowed: true };
}

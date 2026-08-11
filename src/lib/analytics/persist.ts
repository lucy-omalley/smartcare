import { prisma } from "@/lib/db";
import { sanitizeProperties } from "@/lib/analytics/sanitize";
import type { AnalyticsEvent } from "@/lib/analytics/events";
import type { EventContext } from "@/lib/analytics-platform/context";

export type PersistEventInput = {
  event: AnalyticsEvent | string;
  userId?: string | null;
  properties?: Record<string, unknown>;
  context?: EventContext;
};

/** Persist sanitized events for founder analytics (async, non-blocking). */
export async function persistAnalyticsEvent(
  event: AnalyticsEvent | string,
  userId?: string | null,
  properties?: Record<string, unknown>,
  context?: EventContext
): Promise<void> {
  return persistAnalyticsEventFull({ event, userId, properties, context });
}

export async function persistAnalyticsEventFull(input: PersistEventInput): Promise<void> {
  const { event, userId, properties, context } = input;
  try {
    await prisma.analyticsEvent.create({
      data: {
        userId: userId ?? null,
        event,
        properties: (sanitizeProperties(properties) ?? {}) as object,
        sessionId: context?.sessionId ?? null,
        feature: context?.feature ?? (properties?.feature as string | undefined) ?? null,
        source: context?.source ?? null,
        device: context?.device ?? null,
        browser: context?.browser ?? null,
        platform: context?.platform ?? null,
        country: context?.country ?? null,
      },
    });

    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { lastActiveAt: new Date() },
      }).catch(() => {});
    }
  } catch (err) {
    console.warn("[analytics] persist failed:", err);
  }
}

export async function persistAnalyticsError(
  source: string,
  message: string,
  userId?: string | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.analyticsError.create({
      data: {
        userId: userId ?? null,
        source,
        message: message.slice(0, 500),
        metadata: (sanitizeProperties(metadata) ?? {}) as object,
      },
    });
  } catch (err) {
    console.warn("[analytics] error persist failed:", err);
  }
}

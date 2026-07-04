import { prisma } from "@/lib/db";
import { sanitizeProperties } from "@/lib/analytics/sanitize";
import type { AnalyticsEvent } from "@/lib/analytics/events";

/** Persist sanitized events for founder dashboard (async, non-blocking). */
export async function persistAnalyticsEvent(
  event: AnalyticsEvent | string,
  userId?: string | null,
  properties?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        userId: userId ?? null,
        event,
        properties: (sanitizeProperties(properties) ?? {}) as object,
      },
    });
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

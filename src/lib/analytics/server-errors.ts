import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { persistAnalyticsError } from "@/lib/analytics/persist";
import { sanitizeProperties } from "@/lib/analytics/sanitize";
import { captureServerException } from "@/lib/monitoring/sentry";

export async function trackServerError(
  source: string,
  error: unknown,
  userId?: string | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const clean = sanitizeProperties({
    ...metadata,
    error_type: error instanceof Error ? error.name : "Error",
  });

  captureServerException(error, { source, userId, ...clean });

  await Promise.allSettled([
    persistAnalyticsError(source, message, userId ?? null, clean),
    userId
      ? captureServerEvent(userId, "app_error", { source, error_message: message.slice(0, 200), ...clean })
      : Promise.resolve(),
  ]);
}

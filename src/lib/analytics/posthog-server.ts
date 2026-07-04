import { PostHog } from "posthog-node";
import { getPostHogHost, getPostHogKey } from "@/lib/analytics/posthog-client";
import { sanitizeProperties } from "@/lib/analytics/sanitize";
import type { AnalyticsEvent } from "@/lib/analytics/events";

let serverClient: PostHog | null = null;

/** Server-side PostHog — uses POSTHOG_KEY or NEXT_PUBLIC_POSTHOG_KEY. Never expose server key to client. */
function getServerKey(): string | undefined {
  return (
    process.env.POSTHOG_KEY?.trim() ||
    process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() ||
    undefined
  );
}

export function getPostHogServer(): PostHog | null {
  const key = getServerKey();
  if (!key) return null;
  if (!serverClient) {
    serverClient = new PostHog(key, {
      host: getPostHogHost(),
      flushAt: 10,
      flushInterval: 5000,
    });
  }
  return serverClient;
}

export async function captureServerEvent(
  distinctId: string,
  event: AnalyticsEvent | string,
  properties?: Record<string, unknown>
): Promise<void> {
  const client = getPostHogServer();
  if (!client) return;
  client.capture({
    distinctId,
    event,
    properties: sanitizeProperties(properties),
  });
}

export async function shutdownPostHogServer(): Promise<void> {
  if (serverClient) {
    await serverClient.shutdown();
    serverClient = null;
  }
}

import type { AnalyticsEvent, FeatureName } from "@/lib/analytics/events";
import { getPostHogClient } from "@/lib/analytics/posthog-client";
import { sanitizeProperties } from "@/lib/analytics/sanitize";

const PENDING_KEY = "parenfy_analytics_pending";
const MAX_PENDING = 50;

type PendingEvent = { event: string; properties?: Record<string, unknown>; ts: number };

function queuePending(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    const list: PendingEvent[] = raw ? JSON.parse(raw) : [];
    list.push({ event, properties, ts: Date.now() });
    localStorage.setItem(PENDING_KEY, JSON.stringify(list.slice(-MAX_PENDING)));
  } catch {
    /* ignore */
  }
}

function flushPending() {
  if (typeof window === "undefined") return;
  const ph = getPostHogClient();
  if (!ph) return;
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return;
    const list: PendingEvent[] = JSON.parse(raw);
    for (const item of list) {
      ph.capture(item.event, sanitizeProperties(item.properties));
    }
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

function sendToPersistApi(event: string, properties?: Record<string, unknown>, attempt = 0) {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({ event, properties: sanitizeProperties(properties) });
  try {
    if (navigator.sendBeacon && attempt === 0) {
      const ok = navigator.sendBeacon("/api/analytics/track", new Blob([body], { type: "application/json" }));
      if (ok) return;
    }
  } catch {
    /* fall through */
  }
  void fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    if (attempt < 2) {
      window.setTimeout(() => sendToPersistApi(event, properties, attempt + 1), 1000 * (attempt + 1));
    }
  });
}

/** Track a product analytics event (PostHog + internal store). Non-blocking. */
export function trackEvent(event: AnalyticsEvent, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;

  const clean = sanitizeProperties(properties);
  const ph = getPostHogClient();

  if (ph) {
    ph.capture(event, clean);
    flushPending();
  } else {
    queuePending(event, clean);
  }

  sendToPersistApi(event, clean);

  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", event, clean);
  }
}

/** Track feature/page usage for popularity metrics. */
export function trackFeatureUsed(feature: FeatureName, path?: string): void {
  trackEvent("feature_used", { feature, path });
}

export type IdentifyTraits = {
  email?: string | null;
  signup_date?: string;
  child_age?: string | null;
  subscription_type?: string;
};

/** Identify logged-in user in PostHog (no child names or private notes). */
export function identifyUser(userId: string, traits: IdentifyTraits): void {
  if (typeof window === "undefined") return;
  const ph = getPostHogClient();
  if (!ph) return;

  ph.identify(userId, sanitizeProperties({
    email: traits.email ?? undefined,
    signup_date: traits.signup_date,
    child_age: traits.child_age ?? undefined,
    subscription_type: traits.subscription_type ?? "free",
  }));
  flushPending();
}

export function resetAnalyticsIdentity(): void {
  if (typeof window === "undefined") return;
  getPostHogClient()?.reset();
}

export function trackClientError(
  source: string,
  message: string,
  metadata?: Record<string, unknown>
): void {
  trackEvent("app_error", { source, error_message: message.slice(0, 200), ...metadata });
  trackEvent("error_occurred", { source, error_message: message.slice(0, 200), ...metadata });
  if (typeof window === "undefined") return;
  const body = JSON.stringify({
    source,
    message: message.slice(0, 500),
    metadata: sanitizeProperties(metadata),
  });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics/error", new Blob([body], { type: "application/json" }));
      return;
    }
  } catch {
    /* fall through */
  }
  void fetch("/api/analytics/error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

export { flushPending as flushPendingAnalytics };

import type posthogJs from "posthog-js";

let posthog: typeof posthogJs | null = null;
let initialized = false;

/** PostHog project key — set NEXT_PUBLIC_POSTHOG_KEY in Vercel. Never hardcode keys. */
export function getPostHogKey(): string | undefined {
  return process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || undefined;
}

/** PostHog host — defaults to US cloud; use NEXT_PUBLIC_POSTHOG_HOST for EU self-hosted. */
export function getPostHogHost(): string {
  return process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";
}

export function isPostHogEnabled(): boolean {
  return Boolean(getPostHogKey());
}

export function initPostHogClient(): typeof posthogJs | null {
  if (typeof window === "undefined") return null;
  const key = getPostHogKey();
  if (!key) return null;

  if (!posthog) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    posthog = require("posthog-js").default as typeof posthogJs;
  }

  if (initialized) return posthog;

  posthog.init(key, {
    api_host: getPostHogHost(),
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    persistence: "localStorage+cookie",
    autocapture: false,
    disable_session_recording: false,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "[data-ph-mask], [data-sensitive], textarea, input[type='password']",
    },
    loaded: (client) => {
      if (process.env.NODE_ENV === "development") {
        client.debug(false);
      }
    },
  });

  initialized = true;
  return posthog;
}

export function getPostHogClient(): typeof posthogJs | null {
  if (!initialized) return initPostHogClient();
  return posthog;
}

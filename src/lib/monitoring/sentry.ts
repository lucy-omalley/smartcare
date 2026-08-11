import "server-only";

type SentryModule = typeof import("@sentry/nextjs");

let sentryModule: SentryModule | null = null;

function getSentry(): SentryModule | null {
  if (!process.env.SENTRY_DSN?.trim()) return null;
  if (!sentryModule) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      sentryModule = require("@sentry/nextjs") as SentryModule;
    } catch {
      return null;
    }
  }
  return sentryModule;
}

export function captureServerException(
  error: unknown,
  context?: Record<string, unknown>
): void {
  const Sentry = getSentry();
  if (!Sentry) return;

  Sentry.withScope((scope) => {
    if (context) {
      for (const [key, value] of Object.entries(context)) {
        scope.setExtra(key, value);
      }
    }
    Sentry.captureException(error);
  });
}

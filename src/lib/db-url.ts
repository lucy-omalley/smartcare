/**
 * Normalize Neon DATABASE_URL for serverless (Vercel + Prisma).
 * Fixes P1001 timeouts when compute wakes from scale-to-zero.
 */
export function getDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    throw new Error("DATABASE_URL is not configured");
  }

  try {
    const url = new URL(raw);
    if (!url.searchParams.has("sslmode")) {
      url.searchParams.set("sslmode", "require");
    }
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "15");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "15");
    }
    return url.toString();
  } catch {
    // Fallback if URL parsing fails (malformed env var)
    if (raw.includes("sslmode=")) return raw;
    const sep = raw.includes("?") ? "&" : "?";
    return `${raw}${sep}sslmode=require&connect_timeout=15&pool_timeout=15`;
  }
}

/** Retry transient Neon wake-up / P1001 errors (serverless cold start). */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  opts: { retries?: number; delayMs?: number } = {}
): Promise<T> {
  const retries = opts.retries ?? 3;
  const delayMs = opts.delayMs ?? 1500;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const msg = error instanceof Error ? error.message : String(error);
      const retryable =
        msg.includes("P1001") ||
        msg.includes("Can't reach database server") ||
        msg.includes("Connection terminated") ||
        msg.includes("ETIMEDOUT") ||
        msg.includes("ECONNREFUSED");

      if (!retryable || attempt === retries) break;
      await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
    }
  }

  throw lastError;
}

const DEFAULT_POST_AUTH_PATH = "/today";

const BLOCKED_REDIRECT_PREFIXES = [
  "/auth/signin",
  "/auth/register",
  "/auth/error",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/api/auth",
];

/** Prevent redirect loops through auth pages after login. */
export function resolveSafePostAuthUrl(
  callbackUrl: string | null | undefined,
  baseUrl?: string
): string {
  if (!callbackUrl?.trim()) {
    return DEFAULT_POST_AUTH_PATH;
  }

  let path = callbackUrl.trim();

  try {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      const parsed = new URL(path);
      if (baseUrl) {
        const base = new URL(baseUrl);
        if (parsed.origin !== base.origin) {
          return DEFAULT_POST_AUTH_PATH;
        }
      }
      path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return DEFAULT_POST_AUTH_PATH;
  }

  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  const pathOnly = path.split("?")[0].split("#")[0].toLowerCase();

  if (BLOCKED_REDIRECT_PREFIXES.some((blocked) => pathOnly.startsWith(blocked))) {
    return DEFAULT_POST_AUTH_PATH;
  }

  if (pathOnly.includes("/auth/signin") || path.includes("callbackurl=")) {
    return DEFAULT_POST_AUTH_PATH;
  }

  return path.split("?")[0] === "/home" ? DEFAULT_POST_AUTH_PATH : path;
}

export function resolveAuthBaseUrlFromEnv(): string {
  return (
    process.env.NEXTAUTH_URL?.trim().replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/\/$/, "")}` : "http://localhost:3000")
  );
}

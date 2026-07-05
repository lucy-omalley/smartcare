import { NextRequest, NextResponse } from "next/server";
import {
  isGitHubOAuthConfigured,
  isGoogleOAuthConfigured,
} from "@/lib/auth-providers";

export const dynamic = "force-dynamic";

function resolveAuthBaseUrl(request: NextRequest): string {
  const configured = process.env.NEXTAUTH_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl.replace(/\/$/, "")}`;

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) {
    const protocol = request.headers.get("x-forwarded-proto") ?? "https";
    return `${protocol}://${host}`.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

export async function GET(request: NextRequest) {
  const googleConfigured = isGoogleOAuthConfigured();
  const githubConfigured = isGitHubOAuthConfigured();
  const baseUrl = resolveAuthBaseUrl(request);

  const googleEnvPresent = Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
  const githubEnvPresent = Boolean(
    process.env.GITHUB_ID?.trim() && process.env.GITHUB_SECRET?.trim()
  );

  return NextResponse.json({
    google: googleConfigured,
    github: githubConfigured,
    misconfigured:
      (googleEnvPresent && !googleConfigured) ||
      (githubEnvPresent && !githubConfigured),
    baseUrl,
    redirectUris: {
      google: `${baseUrl}/api/auth/callback/google`,
      github: `${baseUrl}/api/auth/callback/github`,
    },
  });
}

import { NextResponse } from "next/server";
import {
  isGitHubOAuthConfigured,
  isGoogleOAuthConfigured,
} from "@/lib/auth-providers";

export const dynamic = "force-dynamic";

export async function GET() {
  const googleConfigured = isGoogleOAuthConfigured();
  const githubConfigured = isGitHubOAuthConfigured();

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
  });
}

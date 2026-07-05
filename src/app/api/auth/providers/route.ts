import { NextResponse } from "next/server";
import {
  isGitHubOAuthConfigured,
  isGoogleOAuthConfigured,
} from "@/lib/auth-providers";
import { isNextAuthSecretConfigured } from "@/lib/auth/session-cookie";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    google: isGoogleOAuthConfigured(),
    github: isGitHubOAuthConfigured(),
    authConfigured: isNextAuthSecretConfigured(),
  });
}

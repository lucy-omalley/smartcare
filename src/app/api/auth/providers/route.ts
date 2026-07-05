import { NextResponse } from "next/server";
import {
  isGitHubOAuthConfigured,
  isGoogleOAuthConfigured,
} from "@/lib/auth-providers";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    google: isGoogleOAuthConfigured(),
    github: isGitHubOAuthConfigured(),
  });
}

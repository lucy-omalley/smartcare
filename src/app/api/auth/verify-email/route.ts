import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/auth/email-verification";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const email = request.nextUrl.searchParams.get("email");

  if (!token || !email) {
    return NextResponse.redirect(
      new URL("/auth/verify-email?error=invalid", request.url)
    );
  }

  const result = await verifyEmailToken(email, token);

  if (!result.ok) {
    return NextResponse.redirect(
      new URL(
        `/auth/verify-email?error=${encodeURIComponent(result.error)}`,
        request.url
      )
    );
  }

  return NextResponse.redirect(new URL("/auth/verify-email?verified=1", request.url));
}

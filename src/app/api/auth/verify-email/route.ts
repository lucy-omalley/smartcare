import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/auth/email-verification";
import { prisma } from "@/lib/db";
import {
  attachSessionCookie,
  createSessionToken,
  isNextAuthSecretConfigured,
} from "@/lib/auth/session-cookie";

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

  const user = await prisma.user.findUnique({
    where: { id: result.userId },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      onboardingComplete: true,
    },
  });

  if (!user?.email) {
    return NextResponse.redirect(new URL("/auth/verify-email?verified=1", request.url));
  }

  const nextPath = user.onboardingComplete ? "/today" : "/onboarding";
  const redirectUrl = new URL(`${nextPath}?verified=1`, request.url);

  if (!isNextAuthSecretConfigured()) {
    return NextResponse.redirect(redirectUrl);
  }

  const sessionToken = await createSessionToken({
    id: user.id,
    email: user.email,
    name: user.name ?? "",
    image: user.image,
    emailVerified: true,
  });

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/auth/verify-email?verified=1", request.url));
  }

  const response = NextResponse.redirect(redirectUrl);
  return attachSessionCookie(response, sessionToken);
}

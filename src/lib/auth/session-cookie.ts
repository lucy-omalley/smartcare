import { encode } from "next-auth/jwt";
import { NextResponse } from "next/server";

export const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export function isNextAuthSecretConfigured(): boolean {
  return Boolean(process.env.NEXTAUTH_SECRET?.trim());
}

export function usesSecureSessionCookies(): boolean {
  return (
    process.env.NEXTAUTH_URL?.startsWith("https://") ?? Boolean(process.env.VERCEL)
  );
}

export function getSessionCookieName(): string {
  return usesSecureSessionCookies()
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";
}

export async function createSessionToken(user: {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  emailVerified?: boolean;
}): Promise<string | null> {
  const secret = process.env.NEXTAUTH_SECRET?.trim();
  if (!secret) return null;

  return encode({
    token: {
      sub: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.image ?? undefined,
      emailVerified: user.emailVerified === true,
    },
    secret,
    maxAge: SESSION_MAX_AGE,
  });
}

export function attachSessionCookie(
  response: NextResponse,
  sessionToken: string
): NextResponse {
  response.cookies.set(getSessionCookieName(), sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: usesSecureSessionCookies(),
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}

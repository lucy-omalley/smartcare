import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import { resolveSafePostAuthUrl } from "@/lib/auth/callback-url";
import {
  attachSessionCookie,
  createSessionToken,
  isNextAuthSecretConfigured,
} from "@/lib/auth/session-cookie";
import { persistAnalyticsEvent } from "@/lib/analytics/persist";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { checkLoginRateLimit, recordLoginAttempt } from "@/lib/rate-limit-login";
import { clientIpFromRequest } from "@/lib/upstash";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = clientIpFromRequest(req);

  if (!isNextAuthSecretConfigured()) {
    return NextResponse.json(
      {
        error:
          "Sign-in is not configured. Add NEXTAUTH_SECRET in Vercel environment variables, then redeploy.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const callbackUrl =
      typeof body.callbackUrl === "string" ? body.callbackUrl : undefined;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const rateLimit = await checkLoginRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Please wait a few minutes and try again." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, image: true, password: true, emailVerified: true, isAdmin: true },
    });

    if (!user?.password) {
      await recordLoginAttempt(ip);
      return NextResponse.json(
        { error: "Invalid email or password. Please try again." },
        { status: 401 }
      );
    }

    const valid = await compare(password, user.password);
    if (!valid) {
      await recordLoginAttempt(ip);
      return NextResponse.json(
        { error: "Invalid email or password. Please try again." },
        { status: 401 }
      );
    }

    const sessionToken = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      emailVerified: user.emailVerified != null || user.isAdmin,
    });
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Could not create session. Check NEXTAUTH_SECRET in Vercel." },
        { status: 500 }
      );
    }

    await Promise.allSettled([
      persistAnalyticsEvent("login", user.id, { method: "email" }),
      captureServerEvent(user.id, "login", { method: "email" }),
    ]);

    const redirect = resolveSafePostAuthUrl(
      user.emailVerified != null || user.isAdmin ? callbackUrl : "/auth/verify-email"
    );
    const response = NextResponse.json({ ok: true, redirect });
    return attachSessionCookie(response, sessionToken);
  } catch (error) {
    console.error("[login] Error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

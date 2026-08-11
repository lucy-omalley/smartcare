import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { persistAnalyticsEvent } from "@/lib/analytics/persist";
import { normalizeReferralSource } from "@/lib/analytics-platform/referral";
import { looksLikeBotRegistration, normalizeGmailAddress } from "@/lib/bot-detection";
import {
  checkRegistrationRateLimit,
  recordRegistrationAttempt,
} from "@/lib/rate-limit-registration";
import { verifyTurnstileToken, isTurnstileConfigured } from "@/lib/turnstile";
import { clientIpFromRequest } from "@/lib/upstash";
import { looksLikeHumanName, verifyRegistrationGuard } from "@/lib/registration-guard";

export async function POST(req: Request) {
  const ip = clientIpFromRequest(req);

  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      name?: string;
      referralSource?: string;
      turnstileToken?: string;
      honeypot?: string;
      formLoadedAt?: number;
    };

    if (isTurnstileConfigured()) {
      const captcha = await verifyTurnstileToken(body.turnstileToken, ip);
      if (!captcha.ok) {
        return NextResponse.json({ error: captcha.error ?? "CAPTCHA failed" }, { status: 400 });
      }
    } else {
      const guard = verifyRegistrationGuard(body);
      if (!guard.ok) {
        await recordRegistrationAttempt(ip);
        return NextResponse.json({ error: guard.error ?? "Registration blocked" }, { status: 400 });
      }
    }

    const rateLimit = await checkRegistrationRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many registration attempts from this network. Please try again later.",
          code: "RATE_LIMIT",
        },
        {
          status: 429,
          headers: rateLimit.retryAfterSeconds
            ? { "Retry-After": String(rateLimit.retryAfterSeconds) }
            : undefined,
        }
      );
    }

    const email = body.email?.trim().toLowerCase();
    const trimmedName = body.name?.trim();
    const password = body.password;

    if (!email || !password || !trimmedName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (trimmedName.length < 2 || trimmedName.length > 80) {
      return NextResponse.json({ error: "Please enter a valid name" }, { status: 400 });
    }

    if (!looksLikeHumanName(trimmedName)) {
      await recordRegistrationAttempt(ip);
      return NextResponse.json(
        { error: "Please enter your real name (letters only, no numbers)." },
        { status: 400 }
      );
    }

    if (looksLikeBotRegistration(trimmedName, email)) {
      await recordRegistrationAttempt(ip);
      return NextResponse.json(
        { error: "Registration could not be completed. Please use a real name and email." },
        { status: 400 }
      );
    }

    const normalizedEmail = normalizeGmailAddress(email);
    if (normalizedEmail.endsWith("@gmail.com")) {
      const gmailUsers = await prisma.user.findMany({
        where: {
          OR: [
            { email: { endsWith: "@gmail.com", mode: "insensitive" } },
            { email: { endsWith: "@googlemail.com", mode: "insensitive" } },
          ],
        },
        select: { email: true },
      });
      const aliasHit = gmailUsers.some((u) => normalizeGmailAddress(u.email) === normalizedEmail);
      if (aliasHit) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 400 }
        );
      }
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      if (!existingUser.password) {
        return NextResponse.json(
          {
            error:
              "An account with this email already exists. Please sign in with Google or GitHub.",
          },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name: trimmedName,
        password: hashedPassword,
        referralSource: normalizeReferralSource(body.referralSource),
        signupPlatform: "web",
      },
    });

    await recordRegistrationAttempt(ip);

    await Promise.allSettled([
      persistAnalyticsEvent("signup_completed", user.id, { method: "email" }),
      captureServerEvent(user.id, "signup_completed", { method: "email" }),
    ]);

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { message: "User created successfully", user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    const message =
      error instanceof Error && error.message.includes("Unique constraint")
        ? "User already exists"
        : "Error creating user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

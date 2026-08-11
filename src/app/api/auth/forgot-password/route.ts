import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  buildResetPasswordUrl,
  createPasswordResetToken,
  normalizeEmail,
} from "@/lib/auth/password-reset";
import { sendPasswordResetEmail } from "@/lib/email/send-email";
import {
  checkPasswordResetRateLimit,
  recordPasswordResetAttempt,
} from "@/lib/rate-limit-password-reset";
import { clientIpFromRequest } from "@/lib/upstash";

export const dynamic = "force-dynamic";

const GENERIC_MESSAGE =
  "If an account exists with that email, we sent a password reset link.";

export async function POST(req: Request) {
  const ip = clientIpFromRequest(req);

  const rateLimit = await checkPasswordResetRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: GENERIC_MESSAGE },
      {
        status: 429,
        headers: rateLimit.retryAfterSeconds
          ? { "Retry-After": String(rateLimit.retryAfterSeconds) }
          : undefined,
      }
    );
  }

  try {
    const body = await req.json();
    const email = normalizeEmail(typeof body.email === "string" ? body.email : "");

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true },
    });

    if (!user?.password) {
      await recordPasswordResetAttempt(ip);
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    const rawToken = await createPasswordResetToken(email);
    const resetUrl = buildResetPasswordUrl(rawToken);
    const emailResult = await sendPasswordResetEmail(email, resetUrl);

    if (!emailResult.sent && !emailResult.devMode) {
      console.error("[forgot-password] Email failed for", email, emailResult.error);
    }

    const payload: Record<string, string> = { message: GENERIC_MESSAGE };

    if (process.env.NODE_ENV === "development" && emailResult.devMode) {
      payload.devResetUrl = resetUrl;
    }

    await recordPasswordResetAttempt(ip);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[forgot-password] Error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

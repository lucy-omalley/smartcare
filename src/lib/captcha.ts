import "server-only";

import { isRecaptchaConfigured, verifyRecaptchaToken } from "@/lib/recaptcha";
import { isTurnstileConfigured, verifyTurnstileToken } from "@/lib/turnstile";
import { verifyRegistrationGuard } from "@/lib/registration-guard";

export type CaptchaVerifyInput = {
  recaptchaToken?: string;
  turnstileToken?: string;
  honeypot?: string;
  formLoadedAt?: number;
};

export function isAnyCaptchaConfigured(): boolean {
  return isRecaptchaConfigured() || isTurnstileConfigured();
}

/** Prefer Google reCAPTCHA, then Cloudflare Turnstile, then honeypot (dev only). */
export async function verifyRegistrationCaptcha(
  input: CaptchaVerifyInput,
  remoteIp?: string
): Promise<{ ok: boolean; error?: string }> {
  if (isRecaptchaConfigured()) {
    return verifyRecaptchaToken(input.recaptchaToken);
  }

  if (isTurnstileConfigured()) {
    return verifyTurnstileToken(input.turnstileToken, remoteIp);
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_INSECURE_REGISTRATION !== "true"
  ) {
    console.error(
      "Registration blocked: set RECAPTCHA_SECRET_KEY or TURNSTILE_SECRET_KEY in production"
    );
    return {
      ok: false,
      error: "Registration is temporarily unavailable. Please try again later.",
    };
  }

  return verifyRegistrationGuard(input);
}

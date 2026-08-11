import "server-only";

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

export function isRecaptchaConfigured(): boolean {
  return Boolean(process.env.RECAPTCHA_SECRET_KEY?.trim());
}

export async function verifyRecaptchaToken(
  token: string | undefined | null,
  remoteIp?: string
): Promise<{ ok: boolean; error?: string }> {
  const secret = process.env.RECAPTCHA_SECRET_KEY?.trim();
  if (!secret) return { ok: true };

  if (!token?.trim()) {
    return { ok: false, error: "Please complete the CAPTCHA verification." };
  }

  try {
    const body = new URLSearchParams({
      secret,
      response: token.trim(),
    });
    if (remoteIp && remoteIp !== "unknown") {
      body.set("remoteip", remoteIp);
    }

    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const data = (await res.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };

    if (data.success) return { ok: true };

    console.warn("reCAPTCHA verification failed:", data["error-codes"]);
    return { ok: false, error: "CAPTCHA verification failed. Please try again." };
  } catch (error) {
    console.error("reCAPTCHA verify error:", error);
    return { ok: false, error: "CAPTCHA verification unavailable." };
  }
}

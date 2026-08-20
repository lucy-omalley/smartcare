import "server-only";

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

export function isRecaptchaConfigured(): boolean {
  return Boolean(process.env.RECAPTCHA_SECRET_KEY?.trim());
}

function messageForRecaptchaErrors(codes: string[] | undefined): string {
  const list = codes ?? [];
  if (list.includes("invalid-input-secret")) {
    return "CAPTCHA is misconfigured (server secret key). Check RECAPTCHA_SECRET_KEY in Vercel.";
  }
  if (list.includes("invalid-keys")) {
    return "CAPTCHA keys are invalid. Ensure site key and secret key are from the same reCAPTCHA v2 site.";
  }
  if (list.includes("timeout-or-duplicate")) {
    return "CAPTCHA expired. Please check the box again and submit within a minute.";
  }
  if (list.includes("bad-request")) {
    return "CAPTCHA request was invalid. Refresh the page and try again.";
  }
  // Most common: domain not listed in Google console, or v3 keys used with v2 widget
  if (list.includes("invalid-input-response")) {
    return "CAPTCHA could not be verified. Add this site's domain in Google reCAPTCHA settings (including www), use reCAPTCHA v2 checkbox keys, then refresh and try again.";
  }
  return "CAPTCHA verification failed. Refresh the page, complete the checkbox again, and retry.";
}

export async function verifyRecaptchaToken(
  token: string | undefined | null
): Promise<{ ok: boolean; error?: string; errorCodes?: string[] }> {
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

    const codes = data["error-codes"];
    console.warn("reCAPTCHA verification failed:", codes);
    return {
      ok: false,
      error: messageForRecaptchaErrors(codes),
      errorCodes: codes,
    };
  } catch (error) {
    console.error("reCAPTCHA verify error:", error);
    return { ok: false, error: "CAPTCHA verification unavailable. Please try again shortly." };
  }
}

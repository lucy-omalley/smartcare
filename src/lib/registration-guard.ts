/** Anti-bot checks that work without CAPTCHA (honeypot + timing). */

const MIN_SUBMIT_MS = 2_500;
const MAX_FORM_AGE_MS = 30 * 60 * 1000;

export function verifyRegistrationGuard(body: {
  honeypot?: string;
  formLoadedAt?: number;
}): { ok: boolean; error?: string } {
  if (body.honeypot?.trim()) {
    return { ok: false, error: "Registration could not be completed." };
  }

  const loaded = body.formLoadedAt;
  if (typeof loaded !== "number" || !Number.isFinite(loaded)) {
    return { ok: false, error: "Please refresh the page and try again." };
  }

  const elapsed = Date.now() - loaded;
  if (elapsed < MIN_SUBMIT_MS) {
    return { ok: false, error: "Please take a moment to fill in the form before submitting." };
  }
  if (elapsed > MAX_FORM_AGE_MS) {
    return { ok: false, error: "This form has expired. Please refresh and try again." };
  }

  return { ok: true };
}

/** Names should look like real people — blocks digit-heavy or symbol spam. */
export function looksLikeHumanName(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < 2) return false;
  if (/\d/.test(trimmed)) return false;
  if (!/^[\p{L}\s'.-]+$/u.test(trimmed)) return false;
  return true;
}

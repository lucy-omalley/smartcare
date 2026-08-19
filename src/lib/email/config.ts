/** Resend / transactional email configuration. */

const DEFAULT_FROM = "Parenfy <hello@parenfy.com>";
const DEFAULT_REPLY_TO = "hello@parenfy.com";

export type EmailKind = "verification" | "password_reset";

export function getEmailFromAddress(): string {
  const raw = process.env.EMAIL_FROM?.trim();
  if (!raw) return DEFAULT_FROM;
  // Allow bare address — wrap with display name for better inbox placement
  if (raw.includes("<")) return raw;
  if (raw.includes("@")) return `Parenfy <${raw}>`;
  return DEFAULT_FROM;
}

export function getEmailReplyTo(): string {
  return process.env.EMAIL_REPLY_TO?.trim() || DEFAULT_REPLY_TO;
}

/** Subdomain sender improves reputation vs root domain cold sends (set in Resend + DNS). */
export function getVerificationFromAddress(): string {
  const dedicated = process.env.EMAIL_VERIFICATION_FROM?.trim();
  if (dedicated) {
    return dedicated.includes("<") ? dedicated : `Parenfy <${dedicated}>`;
  }
  return getEmailFromAddress();
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function emailTags(kind: EmailKind): Array<{ name: string; value: string }> {
  return [
    { name: "category", value: "transactional" },
    { name: "type", value: kind },
  ];
}

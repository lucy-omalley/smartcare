/**
 * Heuristics for automated registration spam (Jul 2026 attack patterns).
 * Shared by registration guard and cleanup script.
 */

export function normalizeGmailAddress(email: string): string {
  const lower = email.trim().toLowerCase();
  const [local, domain] = lower.split("@");
  if (!local || !domain) return lower;
  if (domain === "gmail.com" || domain === "googlemail.com") {
    const base = local.replace(/\./g, "").split("+")[0];
    return `${base}@gmail.com`;
  }
  return lower;
}

/** True when name/email match known bot signup patterns. */
export function looksLikeBotRegistration(name: string, email: string): boolean {
  const trimmedName = name.trim();
  const lowerEmail = email.trim().toLowerCase();

  if (lowerEmail.endsWith("@example.com")) return true;

  // Random 15–25 char mixed-case blob names (e.g. xpRAkACdkrhVUPL)
  if (/^[a-zA-Z]{15,25}$/.test(trimmedName)) {
    const upper = (trimmedName.match(/[A-Z]/g) ?? []).length;
    const lower = (trimmedName.match(/[a-z]/g) ?? []).length;
    if (upper >= 3 && lower >= 3) return true;
  }

  // Gmail dot obfuscation (e.g. he.v.e.n.d.o.rsey.199.8@gmail.com)
  const local = lowerEmail.split("@")[0] ?? "";
  if (lowerEmail.endsWith("@gmail.com") && (local.match(/\./g) ?? []).length >= 3) {
    return true;
  }

  return false;
}

/** Safe to remove: bot pattern, never onboarded, never active, not admin. */
export function isSafeBotCleanupCandidate(user: {
  name: string;
  email: string;
  onboardingComplete: boolean;
  isAdmin: boolean;
  lastActiveAt: Date | null;
  lastLoginAt?: Date | null;
  childBirthday?: string | null;
}): boolean {
  if (user.isAdmin) return false;
  if (user.onboardingComplete) return false;
  if (user.lastActiveAt) return false;
  if (user.lastLoginAt) return false;
  if (user.childBirthday) return false;
  return looksLikeBotRegistration(user.name, user.email);
}

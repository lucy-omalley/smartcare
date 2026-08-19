import type { ReferralSource } from "@prisma/client";

/** URL ?source= values → normalized referral source */
const SOURCE_ALIASES: Record<string, ReferralSource> = {
  xiaohongshu: "XIAOHONGSHU",
  xhs: "XIAOHONGSHU",
  whatsapp: "WHATSAPP",
  facebook: "FACEBOOK",
  fb: "FACEBOOK",
  instagram: "INSTAGRAM",
  ig: "INSTAGRAM",
  direct: "DIRECT",
  google: "GOOGLE",
  reddit: "REFERRAL",
  email: "DIRECT",
  friend: "REFERRAL",
  referral: "REFERRAL",
  ref: "REFERRAL",
};

export function normalizeReferralSource(raw?: string | null): ReferralSource {
  if (!raw?.trim()) return "UNKNOWN";
  const key = raw.trim().toLowerCase();
  return SOURCE_ALIASES[key] ?? "UNKNOWN";
}

export const REFERRAL_SOURCE_LABELS: Record<ReferralSource, string> = {
  XIAOHONGSHU: "Xiaohongshu",
  WHATSAPP: "WhatsApp",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  DIRECT: "Direct",
  GOOGLE: "Google",
  REFERRAL: "Referral",
  UNKNOWN: "Unknown",
};

export const REFERRAL_COOKIE = "parenfy_referral_source";

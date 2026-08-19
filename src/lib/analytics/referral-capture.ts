import { REFERRAL_COOKIE, normalizeReferralSource } from "@/lib/analytics-platform/referral";

const STORAGE_KEY = "parenfy_referral_source";
const UTM_MEDIUM_KEY = "parenfy_utm_medium";
const UTM_CAMPAIGN_KEY = "parenfy_utm_campaign";

/** Capture ?source= / utm_* from URL and persist for signup attribution. */
export function captureReferralFromUrl(searchParams?: URLSearchParams | string): void {
  if (typeof window === "undefined") return;
  const params =
    typeof searchParams === "string"
      ? new URLSearchParams(searchParams.startsWith("?") ? searchParams : `?${searchParams}`)
      : searchParams ?? new URLSearchParams(window.location.search);

  const raw = params.get("source") ?? params.get("utm_source");
  const medium = params.get("utm_medium");
  const campaign = params.get("utm_campaign");

  try {
    if (raw) {
      const normalized = normalizeReferralSource(raw);
      localStorage.setItem(STORAGE_KEY, normalized);
      document.cookie = `${REFERRAL_COOKIE}=${normalized}; path=/; max-age=${60 * 60 * 24 * 90}; SameSite=Lax`;
    }
    if (medium) localStorage.setItem(UTM_MEDIUM_KEY, medium);
    if (campaign) localStorage.setItem(UTM_CAMPAIGN_KEY, campaign);
  } catch {
    /* ignore */
  }
}

export function getStoredUtmParams(): { medium?: string; campaign?: string } {
  if (typeof window === "undefined") return {};
  try {
    return {
      medium: localStorage.getItem(UTM_MEDIUM_KEY) ?? undefined,
      campaign: localStorage.getItem(UTM_CAMPAIGN_KEY) ?? undefined,
    };
  } catch {
    return {};
  }
}

export function getStoredReferralSource(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return localStorage.getItem(STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

export function getAnalyticsSessionId(): string {
  if (typeof window === "undefined") return "";
  const key = "parenfy_session_id";
  try {
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    return `sess_${Date.now()}`;
  }
}

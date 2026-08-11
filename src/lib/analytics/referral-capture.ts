import { REFERRAL_COOKIE, normalizeReferralSource } from "@/lib/analytics-platform/referral";

const STORAGE_KEY = "parenfy_referral_source";

/** Capture ?source= from URL and persist for signup attribution. */
export function captureReferralFromUrl(searchParams?: URLSearchParams | string): void {
  if (typeof window === "undefined") return;
  const params =
    typeof searchParams === "string"
      ? new URLSearchParams(searchParams.startsWith("?") ? searchParams : `?${searchParams}`)
      : searchParams ?? new URLSearchParams(window.location.search);

  const raw = params.get("source") ?? params.get("utm_source");
  if (!raw) return;

  const normalized = normalizeReferralSource(raw);
  try {
    localStorage.setItem(STORAGE_KEY, normalized);
    document.cookie = `${REFERRAL_COOKIE}=${normalized}; path=/; max-age=${60 * 60 * 24 * 90}; SameSite=Lax`;
  } catch {
    /* ignore */
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

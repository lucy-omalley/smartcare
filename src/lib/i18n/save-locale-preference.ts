import type { Locale } from "@/lib/i18n/config";
import { persistLocale } from "@/lib/store/locale";
import { trackEvent } from "@/lib/analytics";

export async function saveLocalePreference(locale: Locale, authenticated: boolean) {
  persistLocale(locale);
  if (authenticated) {
    await fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredLocale: locale }),
    }).catch(() => {});
  }
  trackEvent("language_selected", { locale, is_chinese: locale === "zh-CN" });
}

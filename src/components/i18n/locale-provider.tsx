"use client";

import { useSetAtom } from "jotai";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  type Locale,
} from "@/lib/i18n/config";
import { localeAtom, persistLocale } from "@/lib/store/locale";
import { trackEvent } from "@/lib/analytics";

interface LocaleProviderProps {
  children: React.ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const setLocale = useSetAtom(localeAtom);
  const { status } = useSession();
  const syncedProfile = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const langParam = params.get("lang");
    if (langParam) {
      const fromParam = normalizeLocale(langParam);
      setLocale(fromParam);
      persistLocale(fromParam);
      return;
    }

    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored) {
      const normalized = normalizeLocale(stored);
      setLocale(normalized);
      persistLocale(normalized);
      return;
    }

    const browserLang =
      typeof navigator !== "undefined"
        ? navigator.language || navigator.languages?.[0]
        : DEFAULT_LOCALE;
    const detected = normalizeLocale(browserLang);
    setLocale(detected);
    persistLocale(detected);
  }, [setLocale]);

  useEffect(() => {
    if (status !== "authenticated" || syncedProfile.current) return;

    fetch("/api/onboarding")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const profileLocale = data?.profile?.preferredLocale;
        if (profileLocale) {
          const locale = normalizeLocale(profileLocale);
          setLocale(locale);
          persistLocale(locale);
        }
        syncedProfile.current = true;
      })
      .catch(() => {
        syncedProfile.current = true;
      });
  }, [status, setLocale]);

  return <>{children}</>;
}

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

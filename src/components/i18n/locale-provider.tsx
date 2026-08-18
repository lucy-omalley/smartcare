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
import { saveLocalePreference } from "@/lib/i18n/save-locale-preference";
import { localeAtom, persistLocale } from "@/lib/store/locale";

interface LocaleProviderProps {
  children: React.ReactNode;
}

function readStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    return stored ? normalizeLocale(stored) : null;
  } catch {
    return null;
  }
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

    const stored = readStoredLocale();
    if (stored) {
      setLocale(stored);
      persistLocale(stored);
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
        // localStorage always wins — profile is only used when nothing is stored locally
        const stored = readStoredLocale();
        if (stored) {
          setLocale(stored);
          persistLocale(stored);
          const profileLocale = data?.profile?.preferredLocale;
          if (profileLocale && normalizeLocale(profileLocale) !== stored) {
            void saveLocalePreference(stored, true);
          }
          syncedProfile.current = true;
          return;
        }

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

  useEffect(() => {
    if (status === "unauthenticated") {
      syncedProfile.current = false;
    }
  }, [status]);

  return <>{children}</>;
}

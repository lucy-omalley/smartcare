"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { normalizeLocale } from "@/lib/i18n/config";
import { saveLocalePreference } from "@/lib/i18n/save-locale-preference";
import {
  hasStoredLocalePreference,
  localeAtom,
  persistLocale,
  readStoredLocale,
} from "@/lib/store/locale";

interface LocaleProviderProps {
  children: React.ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const locale = useAtomValue(localeAtom);
  const setLocale = useSetAtom(localeAtom);
  const { status } = useSession();
  const profileSynced = useRef(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale === "zh-CN" ? "zh-Hans" : "en";
  }, [locale]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const langParam = params.get("lang");
    if (!langParam) return;
    const fromParam = normalizeLocale(langParam);
    setLocale(fromParam);
    persistLocale(fromParam);
  }, [setLocale]);

  useEffect(() => {
    if (status !== "authenticated" || profileSynced.current) return;

    fetch("/api/onboarding")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (hasStoredLocalePreference()) {
          const stored = readStoredLocale();
          const profileLocale = data?.profile?.preferredLocale;
          if (profileLocale && normalizeLocale(profileLocale) !== stored) {
            void saveLocalePreference(stored, true);
          }
          profileSynced.current = true;
          return;
        }

        const profileLocale = data?.profile?.preferredLocale;
        if (profileLocale) {
          const next = normalizeLocale(profileLocale);
          setLocale(next);
          persistLocale(next);
        }
        profileSynced.current = true;
      })
      .catch(() => {
        profileSynced.current = true;
      });
  }, [status, setLocale]);

  useEffect(() => {
    if (status === "unauthenticated") {
      profileSynced.current = false;
    }
  }, [status]);

  return <>{children}</>;
}

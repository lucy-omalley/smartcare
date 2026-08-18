import { atomWithStorage } from "jotai/utils";
import type { SyncStorage } from "jotai/vanilla/utils/atomWithStorage";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  type Locale,
} from "@/lib/i18n/config";

function applyHtmlLang(locale: Locale) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale === "zh-CN" ? "zh-Hans" : "en";
  }
}

/** Stores plain `en` / `zh-CN` strings (not JSON-wrapped) for backward compatibility. */
export const localeStorage: SyncStorage<Locale> = {
  getItem: (key, initialValue) => {
    if (typeof window === "undefined") return initialValue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initialValue;
      if (raw === "en" || raw === "zh-CN") return raw;
      try {
        const parsed = JSON.parse(raw) as unknown;
        return normalizeLocale(typeof parsed === "string" ? parsed : String(parsed));
      } catch {
        return normalizeLocale(raw);
      }
    } catch {
      return initialValue;
    }
  },
  setItem: (key, value) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, value);
    applyHtmlLang(value);
  },
  removeItem: (key) => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  },
  subscribe: (key, callback, initialValue) => {
    if (typeof window === "undefined") return () => {};
    const handler = (event: StorageEvent) => {
      if (event.key === key) {
        callback(event.newValue ? normalizeLocale(event.newValue) : initialValue);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  },
};

export const localeAtom = atomWithStorage<Locale>(
  LOCALE_STORAGE_KEY,
  DEFAULT_LOCALE,
  localeStorage,
  { getOnInit: true }
);

export function persistLocale(locale: Locale) {
  localeStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export function readStoredLocale(): Locale {
  return localeStorage.getItem(LOCALE_STORAGE_KEY, DEFAULT_LOCALE);
}

export function hasStoredLocalePreference(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LOCALE_STORAGE_KEY) != null;
}

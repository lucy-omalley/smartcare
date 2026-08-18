export const LOCALE_STORAGE_KEY = "parenfy_locale";

/** Supported locales — add new codes here for future languages. */
export const SUPPORTED_LOCALES = [
  { code: "en" as const, label: "English", flag: "🇬🇧", nativeLabel: "English" },
  { code: "zh-CN" as const, label: "Simplified Chinese", flag: "🇨🇳", nativeLabel: "简体中文" },
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number]["code"];

export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "zh-CN";
}

export function normalizeLocale(value: string | null | undefined): Locale {
  if (isLocale(value)) return value;
  if (value?.startsWith("zh")) return "zh-CN";
  return DEFAULT_LOCALE;
}

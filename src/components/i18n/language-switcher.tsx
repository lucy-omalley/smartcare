"use client";

import { useAtom } from "jotai";
import { useSession } from "next-auth/react";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/config";
import { localeAtom, persistLocale } from "@/lib/store/locale";
import { saveLocalePreference } from "@/lib/i18n/save-locale-preference";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "compact" | "full";
}

export function LanguageSwitcher({ className, variant = "compact" }: LanguageSwitcherProps) {
  const [locale, setLocale] = useAtom(localeAtom);
  const { status } = useSession();

  const select = (next: Locale) => {
    if (next === locale) return;
    setLocale(next);
    persistLocale(next);
    void saveLocalePreference(next, status === "authenticated");
  };

  return (
    <div
      className={cn(
        "inline-flex rounded-xl border bg-background/80 p-0.5 gap-0.5",
        variant === "full" && "w-full flex-col sm:flex-row sm:w-auto",
        className
      )}
      role="group"
      aria-label="Language"
    >
      {SUPPORTED_LOCALES.map(({ code, flag, nativeLabel }) => (
        <button
          key={code}
          type="button"
          onClick={() => select(code)}
          className={cn(
            "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
            locale === code
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          )}
        >
          {flag} {nativeLabel}
        </button>
      ))}
    </div>
  );
}

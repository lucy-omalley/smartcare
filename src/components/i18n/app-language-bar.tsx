"use client";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";

/** Compact language toggle for logged-in app pages. */
export function AppLanguageBar() {
  return (
    <div className="fixed top-3 right-3 z-40 sm:top-4 sm:right-4">
      <LanguageSwitcher />
    </div>
  );
}

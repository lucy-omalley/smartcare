"use client";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";

/** Language selector shown on auth pages (before login). */
export function AuthLanguageBar() {
  return (
    <div className="fixed top-4 right-4 z-50">
      <LanguageSwitcher />
    </div>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useTranslation } from "@/hooks/use-translation";

export function ProfileLanguageSettings() {
  const { t, locale } = useTranslation();

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Label className="text-sm font-medium">{t("settings.language")}</Label>
        {locale === "zh-CN" && (
          <Badge variant="secondary" className="rounded-full text-[10px]">
            {t("language.betaBadge")}
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{t("settings.languageHint")}</p>
      <LanguageSwitcher variant="full" />
    </div>
  );
}

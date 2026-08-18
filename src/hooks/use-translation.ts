"use client";

import { useAtomValue } from "jotai";
import { useCallback } from "react";
import { localeAtom } from "@/lib/store/locale";
import { translate } from "@/lib/i18n/translate";

export function useTranslation() {
  const locale = useAtomValue(localeAtom);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale]
  );

  return { t, locale };
}

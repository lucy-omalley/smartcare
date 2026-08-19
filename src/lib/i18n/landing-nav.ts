"use client";

import { V2_NAV } from "@/lib/landing/v2-content";
import { useTranslation } from "@/hooks/use-translation";

const NAV_KEYS: Record<string, string> = {
  "#journey": "nav.yourDay",
  "#growth": "nav.growth",
  "#experiences": "nav.experiences",
  "#testimonials": "nav.parents",
  "#pricing": "nav.pricing",
  "#faq": "nav.faq",
};

export function useLandingNavLabels() {
  const { t } = useTranslation();
  return V2_NAV.map((item) => ({
    ...item,
    label: t(NAV_KEYS[item.href] ?? "nav.more"),
  }));
}

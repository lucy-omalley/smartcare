"use client";

import { useAtomValue } from "jotai";
import { useMemo } from "react";
import {
  getDailyJourney,
  getFaq,
  getGrowthJourneyMarketing,
  getHeroExperiences,
  getLandingSections,
  getPricing,
  getSupportingFeatures,
  getTestimonials,
} from "@/lib/i18n/landing-content";
import { localeAtom } from "@/lib/store/locale";

export function useLandingContent() {
  const locale = useAtomValue(localeAtom);

  return useMemo(
    () => ({
      locale,
      sections: getLandingSections(locale),
      journey: getDailyJourney(locale),
      experiences: getHeroExperiences(locale),
      supporting: getSupportingFeatures(locale),
      testimonials: getTestimonials(locale),
      pricing: getPricing(locale),
      faq: getFaq(locale),
      growthJourney: getGrowthJourneyMarketing(locale),
    }),
    [locale]
  );
}

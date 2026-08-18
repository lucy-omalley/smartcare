"use client";

import dynamic from "next/dynamic";
import { SiteFooter } from "@/components/layout/site-footer";
import { LandingNavV2 } from "@/components/landing/v2/landing-nav";
import { HeroSectionV2 } from "@/components/landing/v2/hero-section";
import { HeroExperiencesSection } from "@/components/landing/v2/hero-experiences-section";

const DailyJourneySection = dynamic(
  () => import("@/components/landing/v2/daily-journey-section").then((m) => m.DailyJourneySection),
  { loading: () => <section className="min-h-[200px]" aria-hidden /> }
);
const SupportingFeaturesSection = dynamic(
  () => import("@/components/landing/v2/supporting-features-section").then((m) => m.SupportingFeaturesSection),
  { loading: () => <section className="min-h-[120px]" aria-hidden /> }
);
const SocialProofSection = dynamic(
  () => import("@/components/landing/v2/social-proof-section").then((m) => m.SocialProofSection),
  { loading: () => <section className="min-h-[120px]" aria-hidden /> }
);
const PricingSectionV2 = dynamic(
  () => import("@/components/landing/v2/pricing-section").then((m) => m.PricingSectionV2),
  { loading: () => <section className="min-h-[200px]" aria-hidden /> }
);
const FaqSectionV2 = dynamic(
  () => import("@/components/landing/v2/faq-section").then((m) => m.FaqSectionV2),
  { loading: () => <section className="min-h-[120px]" aria-hidden /> }
);
const FinalCtaSection = dynamic(
  () => import("@/components/landing/v2/final-cta-section").then((m) => m.FinalCtaSection),
  { loading: () => <section className="min-h-[200px]" aria-hidden /> }
);

/** Premium pre-sign-in marketing homepage (V2). */
export function LandingPageV2() {
  return (
    <div className="flex min-h-screen flex-col landing-v2">
      <LandingNavV2 />
      <main className="flex-1">
        <HeroSectionV2 />
        <HeroExperiencesSection />
        <DailyJourneySection />
        <SupportingFeaturesSection />
        <SocialProofSection />
        <PricingSectionV2 />
        <FaqSectionV2 />
        <FinalCtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}

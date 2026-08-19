"use client";

import { SiteFooter } from "@/components/layout/site-footer";
import { LandingNavV2 } from "@/components/landing/v2/landing-nav";
import { HeroSectionV2 } from "@/components/landing/v2/hero-section";

/** Premium pre-sign-in marketing homepage — activation-focused single message + one CTA. */
export function LandingPageV2() {
  return (
    <div className="flex min-h-screen flex-col landing-v2">
      <LandingNavV2 />
      <main className="flex-1">
        <HeroSectionV2 />
      </main>
      <SiteFooter />
    </div>
  );
}

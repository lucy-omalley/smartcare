"use client";

import Link from "next/link";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HERO } from "@/lib/landing/v2-content";
import { FamilyIllustration } from "@/components/landing/v2/ui/family-illustration";
import { TrustBadges } from "@/components/landing/v2/ui/trust-badges";
import { LandingSection } from "@/components/landing/v2/ui/section-shell";
import { trackEvent } from "@/lib/analytics";

export function HeroSectionV2() {
  const track = (location: string) => trackEvent("beta_cta_clicked", { location });

  return (
    <LandingSection className="pt-8 md:pt-12 pb-12 md:pb-16 overflow-hidden">
      <div className="relative">
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-b from-amber-50/80 via-background to-background dark:from-amber-950/20 rounded-[3rem] blur-3xl opacity-80"
          aria-hidden
        />
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="space-y-8 text-center lg:text-left order-2 lg:order-1">
            <div className="space-y-5">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] text-balance">
                {HERO.headline}
              </h1>
              <p className="text-lg sm:text-xl text-foreground/90 leading-relaxed font-medium">
                {HERO.subheadline}
              </p>
              <p className="text-base text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                {HERO.description}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/auth/register" onClick={() => track("v2_hero_start_free")}>
                <Button size="lg" className="rounded-2xl h-12 px-8 text-base w-full sm:w-auto shadow-lg shadow-primary/20">
                  <Sparkles className="h-4 w-4 mr-2" aria-hidden />
                  {HERO.primaryCta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href={HERO.demoTarget} onClick={() => track("v2_hero_demo")}>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-2xl h-12 px-8 text-base w-full sm:w-auto bg-background/60 backdrop-blur-sm"
                >
                  <Play className="h-4 w-4 mr-2 fill-current" aria-hidden />
                  {HERO.secondaryCta}
                </Button>
              </Link>
            </div>
            <TrustBadges />
          </div>
          <div className="order-1 lg:order-2 flex justify-center landing-fade-up">
            <div className="relative w-full max-w-md lg:max-w-none">
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 via-amber-200/30 to-transparent rounded-[2.5rem] blur-2xl" aria-hidden />
              <FamilyIllustration className="relative w-full h-auto drop-shadow-2xl rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    </LandingSection>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight, Play, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HERO } from "@/lib/landing/v2-content";
import { FamilyIllustration } from "@/components/landing/v2/ui/family-illustration";
import { LandingSection } from "@/components/landing/v2/ui/section-shell";
import { trackEvent } from "@/lib/analytics";

export function HeroSectionV2() {
  const track = (location: string) => trackEvent("beta_cta_clicked", { location });

  return (
    <LandingSection className="pt-10 md:pt-16 pb-16 md:pb-24 overflow-hidden">
      <div className="relative">
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-b from-amber-50/90 via-orange-50/30 to-background dark:from-amber-950/25 dark:via-background rounded-[3rem] blur-3xl opacity-90"
          aria-hidden
        />
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="space-y-10 text-center lg:text-left order-2 lg:order-1">
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.06] text-balance">
                {HERO.headline}
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl text-foreground/90 leading-relaxed font-medium max-w-xl mx-auto lg:mx-0">
                {HERO.subheadlineLines.map((line, i) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
            </div>
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link href="/auth/register" onClick={() => track("v2_hero_start_free")}>
                  <Button
                    size="lg"
                    className="rounded-2xl h-14 px-10 text-base w-full sm:w-auto shadow-xl shadow-primary/25 hover:shadow-primary/35 transition-shadow"
                  >
                    <Sparkles className="h-4 w-4 mr-2" aria-hidden />
                    {HERO.primaryCta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href={HERO.demoTarget} onClick={() => track("v2_hero_demo")}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-2xl h-14 px-10 text-base w-full sm:w-auto bg-background/70 backdrop-blur-sm border-border/80"
                  >
                    <Play className="h-4 w-4 mr-2 fill-current" aria-hidden />
                    {HERO.secondaryCta}
                  </Button>
                </Link>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 justify-center lg:justify-start text-sm text-muted-foreground">
                <div className="flex gap-0.5" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-medium text-foreground/80">{HERO.socialProof}</span>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2 flex justify-center landing-fade-up">
            <div className="relative w-full max-w-lg lg:max-w-none">
              <div
                className="absolute -inset-6 bg-gradient-to-tr from-primary/25 via-amber-200/40 to-orange-100/20 rounded-[3rem] blur-3xl"
                aria-hidden
              />
              <FamilyIllustration className="relative w-full h-auto drop-shadow-2xl rounded-[2rem] landing-float" />
            </div>
          </div>
        </div>
      </div>
    </LandingSection>
  );
}

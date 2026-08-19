"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LANDING_MARKETING } from "@/lib/landing/marketing-images";
import { MarketingImage } from "@/components/landing/v2/ui/marketing-image";
import { trackEvent } from "@/lib/analytics";
import { useTranslation } from "@/hooks/use-translation";
import { scrollToSection } from "@/lib/landing/scroll-to-section";

export function HeroSectionV2() {
  const { t } = useTranslation();
  const track = (location: string) => trackEvent("beta_cta_clicked", { location });

  const questions = [
    t("landing.valueIntro"),
    t("landing.valuePlan"),
    t("landing.valuePlay"),
    t("landing.valueRoutine"),
  ].filter(Boolean);

  const trustBadges = [t("landing.trustPrivacy")];

  return (
    <section
      id="top"
      className="relative min-h-[92dvh] flex flex-col scroll-mt-20 overflow-hidden border-b border-border/40"
    >
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-background dark:from-amber-950/30 dark:via-background"
        aria-hidden
      />
      <div className="container flex-1 flex flex-col justify-center px-4 md:px-6 max-w-6xl mx-auto w-full py-14 md:py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 xl:gap-20 items-center">
          <div className="space-y-8 text-center lg:text-left order-2 lg:order-1 landing-fade-up">
            <div className="space-y-5">
              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] xl:text-6xl font-bold tracking-tight leading-[1.06] text-balance">
                {t("landing.headline")}
              </h1>
              <p className="text-lg sm:text-xl text-foreground/90 leading-relaxed font-medium max-w-xl mx-auto lg:mx-0">
                {t("landing.subheadline")}
              </p>
              <ul className="space-y-2 text-base sm:text-lg text-muted-foreground max-w-md mx-auto lg:mx-0 text-left">
                {questions.map((line) => (
                  <li key={line} className="leading-relaxed flex gap-2">
                    <span className="text-primary shrink-0">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link href="/auth/register" onClick={() => track("v2_hero_create_free_plan")}>
                  <Button
                    size="lg"
                    className="rounded-2xl h-14 px-10 text-base w-full sm:w-auto shadow-xl shadow-primary/25"
                  >
                    <Sparkles className="h-4 w-4 mr-2" aria-hidden />
                    {t("landing.ctaStart")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-2xl h-14 px-10 text-base w-full sm:w-auto bg-background/70 backdrop-blur-sm"
                  onClick={() => {
                    track("v2_hero_see_how");
                    scrollToSection("#journey");
                  }}
                >
                  {t("landing.ctaExplore")}
                </Button>
              </div>

              <div className="flex flex-col gap-3 items-center lg:items-start">
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex gap-0.5" aria-hidden>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="font-semibold text-foreground/90">{t("landing.socialProof")}</span>
                </div>
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  {trustBadges.map((badge) => (
                    <span
                      key={badge}
                      className="text-xs font-medium px-3 py-1.5 rounded-full bg-background/80 border border-border/60 text-muted-foreground"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 flex justify-center lg:justify-end landing-fade-up landing-delay-2">
            <MarketingImage
              src={LANDING_MARKETING.hero}
              alt="Parenfy app on phone with mother and child"
              priority
              floating
              sizes="(max-width: 1024px) 92vw, 48vw"
              className="max-w-xl lg:max-w-none w-full"
              imageClassName="rounded-[1.75rem] object-contain"
            />
          </div>
        </div>
      </div>

      <div className="pb-8 flex justify-center">
        <button
          type="button"
          className="inline-flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-label={t("landing.ctaExplore")}
          onClick={() => scrollToSection("#journey")}
        >
          <span>{t("landing.scrollHint")}</span>
          <ChevronDown className="h-4 w-4 animate-bounce" aria-hidden />
        </button>
      </div>
    </section>
  );
}

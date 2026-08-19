"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LANDING_MARKETING } from "@/lib/landing/marketing-images";
import { MarketingImage } from "@/components/landing/v2/ui/marketing-image";
import { trackEvent } from "@/lib/analytics";
import { useTranslation } from "@/hooks/use-translation";

export function HeroSectionV2() {
  const { t } = useTranslation();
  const track = (location: string) => trackEvent("beta_cta_clicked", { location });

  const questions = [
    t("landing.valueIntro"),
    t("landing.valuePlan"),
    t("landing.valuePlay"),
    t("landing.valueRoutine"),
  ].filter(Boolean);

  const trustBadges = [t("landing.trustAge"), t("landing.trustPrivacy")];

  return (
    <section className="relative min-h-[100dvh] flex flex-col scroll-mt-20 overflow-hidden">
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-background dark:from-amber-950/30 dark:via-background"
        aria-hidden
      />
      <div className="container flex-1 flex flex-col justify-center px-4 md:px-6 max-w-6xl mx-auto w-full py-16 md:py-20 lg:py-24">
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

            <div className="space-y-4">
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
    </section>
  );
}

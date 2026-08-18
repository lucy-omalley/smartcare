"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FINAL_CTA } from "@/lib/landing/v2-content";
import { LANDING_MARKETING } from "@/lib/landing/marketing-images";
import { MarketingImage } from "@/components/landing/v2/ui/marketing-image";
import { LandingSection } from "@/components/landing/v2/ui/section-shell";
import { trackEvent } from "@/lib/analytics";
import { useTranslation } from "@/hooks/use-translation";

export function FinalCtaSection() {
  const { t } = useTranslation();
  return (
    <LandingSection className="pb-24 md:pb-32">
      <div className="relative rounded-[2.5rem] overflow-hidden border bg-gradient-to-br from-primary/15 via-amber-50/60 to-orange-50/40 dark:from-primary/25 dark:via-background shadow-2xl shadow-primary/10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center p-8 md:p-12 lg:p-16">
          <div className="space-y-8 text-center lg:text-left order-2 lg:order-1">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-balance leading-[1.08]">
              {t("landing.finalHeadline")}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-md mx-auto lg:mx-0">
              {FINAL_CTA.description}
            </p>
            <Link href="/auth/register" onClick={() => trackEvent("beta_cta_clicked", { location: "v2_final_cta" })}>
              <Button size="lg" className="rounded-2xl h-14 px-12 text-base shadow-xl shadow-primary/30">
                <Sparkles className="h-4 w-4 mr-2" aria-hidden />
                {t("landing.finalCta")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="order-1 lg:order-2 flex justify-center">
            <MarketingImage
              src={LANDING_MARKETING.hero}
              alt="Parenfy family app — mother and child using Today's Journey"
              sizes="(max-width: 1024px) 85vw, 40vw"
              floating
              className="max-w-md lg:max-w-lg"
            />
          </div>
        </div>
      </div>
    </LandingSection>
  );
}

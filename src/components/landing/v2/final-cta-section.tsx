"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FINAL_CTA } from "@/lib/landing/v2-content";
import { FamilyIllustration } from "@/components/landing/v2/ui/family-illustration";
import { LandingSection } from "@/components/landing/v2/ui/section-shell";
import { trackEvent } from "@/lib/analytics";

export function FinalCtaSection() {
  return (
    <LandingSection className="pb-24 md:pb-32">
      <div className="relative rounded-[2.5rem] overflow-hidden border bg-gradient-to-br from-primary/15 via-amber-50/60 to-orange-50/40 dark:from-primary/25 dark:via-background dark:to-background shadow-2xl shadow-primary/10">
        <div className="grid lg:grid-cols-2 gap-10 items-center p-10 md:p-14 lg:p-20">
          <div className="space-y-8 text-center lg:text-left order-2 lg:order-1">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-balance leading-[1.08]">
              {FINAL_CTA.headline}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-md mx-auto lg:mx-0">
              {FINAL_CTA.description}
            </p>
            <Link href="/auth/register" onClick={() => trackEvent("beta_cta_clicked", { location: "v2_final_cta" })}>
              <Button size="lg" className="rounded-2xl h-14 px-12 text-base shadow-xl shadow-primary/30">
                <Sparkles className="h-4 w-4 mr-2" aria-hidden />
                {FINAL_CTA.cta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="order-1 lg:order-2 flex justify-center">
            <FamilyIllustration className="w-full max-w-md h-auto drop-shadow-xl" />
          </div>
        </div>
      </div>
    </LandingSection>
  );
}

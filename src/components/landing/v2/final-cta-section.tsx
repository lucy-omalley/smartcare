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
    <LandingSection className="pb-20 md:pb-28">
      <div className="relative rounded-[2.5rem] overflow-hidden border bg-gradient-to-br from-primary/10 via-amber-50/50 to-background dark:from-primary/20 dark:via-background dark:to-background">
        <div className="grid lg:grid-cols-2 gap-8 items-center p-8 md:p-12 lg:p-16">
          <div className="space-y-6 text-center lg:text-left order-2 lg:order-1">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-balance leading-tight">
              {FINAL_CTA.headline}
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">{FINAL_CTA.description}</p>
            <Link href="/auth/register" onClick={() => trackEvent("beta_cta_clicked", { location: "v2_final_cta" })}>
              <Button size="lg" className="rounded-2xl h-12 px-10 text-base shadow-lg shadow-primary/25">
                <Sparkles className="h-4 w-4 mr-2" aria-hidden />
                {FINAL_CTA.cta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="order-1 lg:order-2 flex justify-center opacity-95">
            <FamilyIllustration className="w-full max-w-sm h-auto" />
          </div>
        </div>
      </div>
    </LandingSection>
  );
}

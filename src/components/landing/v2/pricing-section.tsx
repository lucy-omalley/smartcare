"use client";

import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRICING_V2, SECTIONS } from "@/lib/landing/v2-content";
import { LandingSection, SectionHeader } from "@/components/landing/v2/ui/section-shell";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

export function PricingSectionV2() {
  const tiers = [
    { ...PRICING_V2.free, highlighted: false },
    { ...PRICING_V2.premium, highlighted: true },
  ];

  return (
    <LandingSection id="pricing" className="bg-muted/15">
      <SectionHeader
        eyebrow={SECTIONS.pricing.eyebrow}
        title={SECTIONS.pricing.title}
        description={SECTIONS.pricing.description}
      />
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={cn(
              "rounded-3xl border p-8 flex flex-col gap-6 bg-card",
              tier.highlighted && "border-primary shadow-xl shadow-primary/10 ring-1 ring-primary/20 md:scale-[1.02]"
            )}
          >
            <div>
              {tier.highlighted && (
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Recommended</p>
              )}
              <h3 className="text-2xl font-bold">{tier.name}</h3>
            </div>
            <ul className="space-y-2.5 flex-1">
              {tier.features.map((f) => (
                <li key={f} className="flex gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/auth/register" onClick={() => trackEvent("beta_cta_clicked", { location: `v2_pricing_${tier.name}` })}>
              <Button
                className="w-full rounded-2xl h-12"
                variant={tier.highlighted ? "default" : "outline"}
                size="lg"
              >
                {tier.highlighted && <Sparkles className="h-4 w-4 mr-2" aria-hidden />}
                {tier.cta}
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </LandingSection>
  );
}

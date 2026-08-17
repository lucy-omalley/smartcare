"use client";

import { Check, X } from "lucide-react";
import { COMPARISON_V2 } from "@/lib/landing/v2-content";
import { LandingSection, SectionHeader } from "@/components/landing/v2/ui/section-shell";

export function WhyParenfySection() {
  return (
    <LandingSection id="comparison">
      <SectionHeader
        eyebrow="Why Parenfy"
        title="Built for daily parenting — not one-off chats"
        description="ChatGPT answers questions. Parenfy runs your family's day."
      />
      <div className="grid md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
        <div className="rounded-3xl border bg-muted/30 p-6 md:p-8 space-y-4">
          <h3 className="font-semibold text-lg text-muted-foreground">ChatGPT</h3>
          <ul className="space-y-3">
            {COMPARISON_V2.generic.map((item) => (
              <li key={item} className="flex gap-3 text-sm text-muted-foreground">
                <X className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border-2 border-primary/30 bg-primary/5 p-6 md:p-8 space-y-4 shadow-lg shadow-primary/5">
          <h3 className="font-semibold text-lg text-primary">Parenfy</h3>
          <ul className="space-y-3">
            {COMPARISON_V2.parenfy.map((item) => (
              <li key={item} className="flex gap-3 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </LandingSection>
  );
}

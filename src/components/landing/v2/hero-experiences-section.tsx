"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HERO_EXPERIENCES_V2, THEME_STYLES } from "@/lib/landing/v2-content";
import { FlowSteps } from "@/components/landing/v2/ui/flow-steps";
import { LandingSection, SectionHeader } from "@/components/landing/v2/ui/section-shell";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

export function HeroExperiencesSection() {
  return (
    <LandingSection id="experiences" className="bg-muted/20">
      <SectionHeader
        eyebrow="Three hero experiences"
        title="Everything parents love — in one calm app"
        description="Equal focus on play, routines, and bedtime. No single feature buried below the fold."
      />
      <div className="space-y-8 md:space-y-12">
        {HERO_EXPERIENCES_V2.map((exp, index) => {
          const theme = THEME_STYLES[exp.theme];
          const reversed = index % 2 === 1;
          return (
            <article
              key={exp.id}
              className={cn(
                "rounded-[2rem] border bg-gradient-to-br p-6 md:p-10 lg:p-12 shadow-sm",
                theme.bg,
                theme.ring,
                "ring-1"
              )}
            >
              <div
                className={cn(
                  "grid lg:grid-cols-2 gap-10 lg:gap-16 items-center",
                  reversed && "lg:[direction:rtl]"
                )}
              >
                <div className={cn("space-y-6", reversed && "lg:[direction:ltr]")}>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-3xl" aria-hidden>
                      {exp.emoji}
                    </span>
                    <span className={cn("text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full", theme.accent)}>
                      {exp.title}
                    </span>
                    {exp.badge && (
                      <Badge variant="secondary" className="rounded-full">
                        {exp.badge}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight whitespace-pre-line leading-tight">
                    {exp.headline}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                    {exp.description}
                  </p>
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {exp.benefits.map((b) => (
                      <li key={b} className="flex gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/auth/register"
                    onClick={() => trackEvent("beta_cta_clicked", { location: `v2_${exp.id}` })}
                  >
                    <Button size="lg" className="rounded-2xl mt-2">
                      {exp.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <div className={cn("flex justify-center", reversed && "lg:[direction:ltr]")}>
                  <FlowSteps steps={exp.flow} />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </LandingSection>
  );
}

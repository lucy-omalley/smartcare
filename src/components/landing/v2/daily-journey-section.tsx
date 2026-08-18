"use client";

import { DAILY_JOURNEY_V2, SECTIONS } from "@/lib/landing/v2-content";
import { LandingSection, SectionHeader } from "@/components/landing/v2/ui/section-shell";
import { cn } from "@/lib/utils";

export function DailyJourneySection() {
  return (
    <LandingSection id="journey" className="bg-muted/10">
      <SectionHeader
        eyebrow={SECTIONS.journey.eyebrow}
        title={SECTIONS.journey.title}
        description={SECTIONS.journey.description}
      />
      <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {DAILY_JOURNEY_V2.map((stage, i) => {
          const Icon = stage.icon;
          return (
            <li
              key={stage.period}
              className={cn(
                "landing-fade-up",
                `landing-delay-${Math.min(i + 1, 4)}`
              )}
            >
              <article
                className={cn(
                  "h-full rounded-[1.75rem] border bg-gradient-to-br p-6 md:p-7 shadow-sm hover:shadow-lg transition-all duration-500 hover:-translate-y-1",
                  stage.gradient
                )}
              >
                <div className="text-4xl mb-4" aria-hidden>
                  {stage.emoji}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">
                  {stage.period}
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <h3 className="font-bold text-lg leading-tight">{stage.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{stage.feature}</p>
              </article>
            </li>
          );
        })}
      </ol>
    </LandingSection>
  );
}

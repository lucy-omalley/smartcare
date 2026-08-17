"use client";

import { DAILY_JOURNEY_V2 } from "@/lib/landing/v2-content";
import { LandingSection, SectionHeader } from "@/components/landing/v2/ui/section-shell";
import { cn } from "@/lib/utils";

export function DailyJourneySection() {
  return (
    <LandingSection id="journey">
      <SectionHeader
        eyebrow="Your day"
        title="How Parenfy fits into your day"
        description="From morning plan to bedtime story — one gentle journey, not ten disconnected apps."
      />
      <div className="relative">
        <div
          className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2"
          aria-hidden
        />
        <ol className="flex flex-col md:flex-row md:justify-between gap-6 md:gap-3 overflow-x-auto pb-2 md:pb-0 snap-x snap-mandatory md:snap-none">
          {DAILY_JOURNEY_V2.map((stage, i) => {
            const Icon = stage.icon;
            return (
              <li
                key={stage.period}
                className={cn(
                  "flex-shrink-0 snap-center md:flex-1 min-w-[200px] md:min-w-0",
                  "landing-fade-up",
                  `landing-delay-${Math.min(i + 1, 6)}`
                )}
              >
                <div className="flex flex-col items-center text-center space-y-3 p-4 rounded-3xl border bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow h-full">
                  <div className="text-3xl" aria-hidden>
                    {stage.emoji}
                  </div>
                  <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                      {stage.period}
                    </p>
                    <p className="font-semibold text-sm mt-1">{stage.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stage.feature}</p>
                  </div>
                  {i < DAILY_JOURNEY_V2.length - 1 && (
                    <span className="md:hidden text-muted-foreground text-xs" aria-hidden>
                      ↓
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </LandingSection>
  );
}

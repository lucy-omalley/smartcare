"use client";

import type { LucideIcon } from "lucide-react";
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
      <div className="relative max-w-2xl mx-auto">
        <div
          className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-200 via-primary/30 to-indigo-200 md:-translate-x-1/2"
          aria-hidden
        />
        <ol className="relative space-y-6 md:space-y-8">
          {DAILY_JOURNEY_V2.map((stage, i) => {
            const Icon = stage.icon;
            const isEven = i % 2 === 0;
            return (
              <li
                key={stage.period}
                className={cn(
                  "relative flex items-center gap-6 md:gap-0",
                  "md:grid md:grid-cols-2 md:items-center",
                  "landing-fade-up",
                  `landing-delay-${Math.min(i + 1, 6)}`
                )}
              >
                <div
                  className={cn(
                    "hidden md:block",
                    isEven ? "md:col-start-1 md:pr-12 md:text-right" : "md:col-start-2 md:pl-12 md:text-left md:col-span-1"
                  )}
                >
                  {isEven && (
                    <JourneyCard stage={stage} Icon={Icon} align="right" />
                  )}
                </div>
                <div
                  className="absolute left-8 md:left-1/2 md:-translate-x-1/2 z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-background border-2 border-primary/20 shadow-md text-2xl"
                  aria-hidden
                >
                  {stage.emoji}
                </div>
                <div className={cn("md:hidden flex-1 pl-20")}>
                  <JourneyCard stage={stage} Icon={Icon} align="left" />
                </div>
                <div
                  className={cn(
                    "hidden md:block",
                    isEven ? "md:col-start-2 md:pl-12" : "md:col-start-1 md:pr-12 md:row-start-1 md:text-right"
                  )}
                >
                  {!isEven && (
                    <JourneyCard stage={stage} Icon={Icon} align="left" />
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

function JourneyCard({
  stage,
  Icon,
  align,
}: {
  stage: (typeof DAILY_JOURNEY_V2)[number];
  Icon: LucideIcon;
  align: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border bg-card/90 backdrop-blur-sm p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow",
        align === "right" ? "md:ml-auto md:max-w-xs" : "md:max-w-xs"
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{stage.period}</p>
      <div className={cn("flex items-center gap-2 mt-2", align === "right" && "md:justify-end")}>
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <p className="font-semibold text-lg">{stage.title}</p>
      </div>
      <p className={cn("text-sm text-muted-foreground mt-1", align === "right" && "md:text-right")}>
        {stage.feature}
      </p>
    </div>
  );
}

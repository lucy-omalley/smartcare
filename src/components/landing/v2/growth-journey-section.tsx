"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLandingContent } from "@/hooks/use-landing-content";
import { LandingSection, SectionHeader } from "@/components/landing/v2/ui/section-shell";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

function MockProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 rounded-full bg-background/70 dark:bg-muted overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function GrowthJourneySection() {
  const { sections, growthJourney } = useLandingContent();
  const mock = growthJourney.mock;

  return (
    <LandingSection id="growth" className="bg-gradient-to-b from-emerald-50/40 via-background to-background dark:from-emerald-950/20">
      <SectionHeader
        eyebrow={sections.growth.eyebrow}
        title={sections.growth.title}
        description={sections.growth.description}
      />

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center max-w-6xl mx-auto">
        <div className="space-y-6 landing-fade-up">
          <ul className="space-y-4">
            {growthJourney.features.map((feature, i) => (
              <li
                key={feature.title}
                className={cn("flex gap-4 landing-fade-up", `landing-delay-${Math.min(i + 1, 5)}`)}
              >
                <span className="text-2xl shrink-0 mt-0.5" aria-hidden>
                  {feature.emoji}
                </span>
                <div>
                  <p className="font-semibold text-base">{feature.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1">{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/auth/register"
              onClick={() => trackEvent("beta_cta_clicked", { location: "landing_growth_journey" })}
            >
              <Button size="lg" className="rounded-2xl h-12 px-8 w-full sm:w-auto">
                <Sparkles className="h-4 w-4 mr-2" />
                {growthJourney.cta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="landing-fade-up landing-delay-2">
          <div className="rounded-[2rem] border bg-card shadow-xl shadow-emerald-200/20 dark:shadow-none overflow-hidden max-w-md mx-auto lg:max-w-none">
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50/80 to-background dark:from-emerald-950/40 dark:via-background p-5 md:p-6 border-b">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-2">
                🌱 {mock.childName}&apos;s Growth Journey
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mb-3">
                <span>Age {mock.ageDisplay}</span>
                <span>·</span>
                <span>{mock.stageLabel}</span>
              </div>
              <p className="text-xs text-muted-foreground">Current growth theme</p>
              <p className="text-xl font-bold mt-1">{mock.growthTheme}</p>
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                  <span>Weekly progress</span>
                  <span>{mock.weeklyProgress}%</span>
                </div>
                <MockProgressBar value={mock.weeklyProgress} />
              </div>
            </div>

            <div className="p-5 md:p-6 space-y-4">
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  🎯 This week&apos;s mission
                </p>
                <p className="text-sm font-medium mt-2 leading-snug">{mock.weeklyMission}</p>
              </div>

              <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Today&apos;s mission
                </p>
                <p className="text-base font-bold mt-2">{mock.todaysMission}</p>
                <p className="text-xs text-muted-foreground mt-1">{mock.missionMinutes} min · Gentle</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {mock.skills.map((skill) => (
                  <div key={skill.label} className="rounded-xl border bg-background p-2.5 text-center">
                    <span className="text-lg" aria-hidden>
                      {skill.emoji}
                    </span>
                    <p className="text-[9px] font-medium leading-tight mt-1 line-clamp-2">{skill.label}</p>
                    <p className="text-xs font-bold text-primary mt-1">{skill.progress}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </LandingSection>
  );
}

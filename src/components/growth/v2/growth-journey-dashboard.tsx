"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GrowthJourneyView } from "@/lib/growth-journey/types";
import { trackEvent } from "@/lib/analytics";

function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2.5 rounded-full bg-muted overflow-hidden", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function SkillRing({ progress, emoji }: { progress: number; emoji: string }) {
  const pct = Math.min(100, Math.max(0, progress));
  return (
    <div className="relative flex h-14 w-14 items-center justify-center shrink-0">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36" aria-hidden>
        <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-muted" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          className="stroke-primary"
          strokeWidth="3"
          strokeDasharray={`${pct} 100`}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-xl relative z-10">{emoji}</span>
    </div>
  );
}

type Props = {
  data: GrowthJourneyView;
};

export function GrowthJourneyDashboard({ data }: Props) {
  const startMission = () => {
    trackEvent("growth_mission_started", { title: data.todaysMission.title });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero */}
      <section className="rounded-[1.75rem] border bg-gradient-to-br from-emerald-50 via-teal-50/80 to-background dark:from-emerald-950/40 dark:via-background p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
          🌱 {data.childName}&apos;s Growth Journey
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-4">
          <span>Age {data.ageDisplay}</span>
          <span>·</span>
          <span>{data.stageLabel}</span>
        </div>
        <p className="text-sm text-muted-foreground mb-1">Current growth theme</p>
        <h1 className="text-2xl font-bold tracking-tight mb-4">{data.growthTheme}</h1>
        <div className="space-y-2 mb-5">
          <div className="flex justify-between text-xs font-medium">
            <span>Weekly progress</span>
            <span>
              {data.hasActivityHistory
                ? `${data.weeklyProgressPercent}%`
                : "Just getting started"}
            </span>
          </div>
          <ProgressBar value={data.weeklyProgressPercent} />
          {!data.hasActivityHistory ? (
            <p className="text-xs text-muted-foreground">
              Complete your first mission on Today to begin tracking progress.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {data.weeklyMission.activitiesCompleted}/{data.weeklyMission.activitiesTarget} missions this week
            </p>
          )}
        </div>
        <Button asChild size="lg" className="w-full rounded-2xl h-12 shadow-md" onClick={startMission}>
          <Link href={data.todaysMission.activityHref}>
            {data.hasActivityHistory ? "Continue Today's Mission" : "Start Today's Mission"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>

      {/* Celebrations */}
      {data.celebrations.length > 0 && (
        <section className="space-y-2">
          {data.celebrations.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-amber-200/80 bg-amber-50/80 dark:bg-amber-950/30 px-4 py-3 text-sm font-medium"
            >
              {c.emoji} {c.message}
            </div>
          ))}
        </section>
      )}

      {/* Weekly Mission */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold px-0.5">🎯 This Week&apos;s Mission</h2>
        <div className="rounded-[1.35rem] border bg-card p-5 space-y-4 shadow-sm">
          <p className="font-semibold text-base leading-snug">{data.weeklyMission.summary}</p>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground mb-2">Why this matters</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {data.weeklyMission.whyItMatters.map((w) => (
                <li key={w} className="flex gap-2">
                  <span className="text-primary">✓</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>
                {data.weeklyMission.activitiesCompleted}/{data.weeklyMission.activitiesTarget} activities
              </span>
              <span>~{data.weeklyMission.estimatedMinutesLeft} min left</span>
            </div>
            <ProgressBar value={data.weeklyMission.progressPercent} />
          </div>
        </div>
      </section>

      {/* Today's Mission */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold px-0.5">Today&apos;s Mission</h2>
        <div className="rounded-[1.35rem] border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background p-5 space-y-4">
          <div>
            <h3 className="text-xl font-bold">{data.todaysMission.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{data.todaysMission.reason}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-background border px-3 py-1">{data.todaysMission.durationMinutes} min</span>
            <span className="rounded-full bg-background border px-3 py-1">{data.todaysMission.difficulty}</span>
            <span className="rounded-full bg-background border px-3 py-1">{data.todaysMission.ageNote}</span>
          </div>
          {data.todaysMission.toys.length > 0 && (
            <p className="text-sm">
              <span className="font-medium">Uses: </span>
              {data.todaysMission.toys.join(", ")}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {data.todaysMission.skills.map((s) => (
              <span key={s} className="text-xs rounded-full bg-primary/10 text-primary px-2.5 py-1">
                {s}
              </span>
            ))}
          </div>
          <Button asChild className="w-full rounded-2xl h-12" onClick={startMission}>
            <Link href={data.todaysMission.activityHref}>Start Mission</Link>
          </Button>
        </div>
      </section>

      {/* Skills */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold px-0.5">Skills Dashboard</h2>
        <div className="grid grid-cols-2 gap-3">
          {data.skills.map((skill) => (
            <div
              key={skill.id}
              className="rounded-[1.25rem] border bg-card p-4 flex gap-3 items-center shadow-sm"
            >
              <SkillRing progress={skill.progress} emoji={skill.emoji} />
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-tight">{skill.label}</p>
                {skill.progress > 0 ? (
                  <p className="text-lg font-bold text-primary">{skill.progress}%</p>
                ) : (
                  <p className="text-xs font-medium text-muted-foreground mt-1">Ready to begin</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Roadmap */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold px-0.5">Personalised Roadmap</h2>
        <div className="rounded-[1.35rem] border bg-card p-5 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max pb-2">
            {data.roadmap.map((node, i) => (
              <div key={node.id} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex flex-col items-center gap-1 min-w-[4.5rem]",
                    node.status === "current" && "scale-105",
                    node.status === "upcoming" && "opacity-50"
                  )}
                >
                  <div
                    className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center text-xl border-2",
                      node.status === "completed" && "border-emerald-400 bg-emerald-50",
                      node.status === "current" && "border-primary bg-primary/10 shadow-md",
                      node.status === "upcoming" && "border-muted bg-muted/30"
                    )}
                  >
                    {node.emoji}
                  </div>
                  <span className="text-[10px] font-medium text-center leading-tight">{node.label}</span>
                </div>
                {i < data.roadmap.length - 1 && (
                  <span className="text-muted-foreground text-lg pb-4">↓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Next Milestones */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold px-0.5">Likely Next Milestones</h2>
        <div className="rounded-[1.35rem] border bg-card p-5 space-y-3">
          <p className="text-sm text-muted-foreground">
            Over the next few months {data.childName} may begin to:
          </p>
          <ul className="space-y-2">
            {data.nextMilestones.map((m) => (
              <li key={m.id} className="flex gap-2 text-sm">
                <span className="text-primary shrink-0">✓</span>
                <span>{m.title}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* AI Coach */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold px-0.5 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Development Coach
        </h2>
        <div className="rounded-[1.35rem] border bg-gradient-to-br from-violet-50/80 to-background dark:from-violet-950/30 p-5 space-y-3">
          <p className="text-sm font-medium">{data.coachInsight}</p>
          <p className="text-sm text-muted-foreground">{data.coachAction}</p>
        </div>
      </section>

      {/* Parent coaching */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold px-0.5">Daily Parent Tip</h2>
        <div className="rounded-[1.35rem] border bg-rose-50/50 dark:bg-rose-950/20 p-5">
          <p className="text-sm leading-relaxed">{data.parentTip}</p>
          <p className="text-xs text-muted-foreground mt-3">~{data.parentTipReadSeconds}s read</p>
        </div>
      </section>

      {/* Interests */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold px-0.5">Interest Development</h2>
        <div className="rounded-[1.35rem] border bg-card p-5 grid grid-cols-2 gap-3">
          {data.interests.map((interest) => (
            <div key={interest.name} className="text-sm">
              <p className="font-medium truncate">{interest.name}</p>
              <p className="text-amber-500 text-xs tracking-wider">
                {"★".repeat(interest.stars)}
                {"☆".repeat(5 - interest.stars)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* School readiness */}
      {data.schoolReadiness && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold px-0.5">School Readiness</h2>
          <p className="text-xs text-muted-foreground px-0.5">Areas to explore — every child grows at their own pace.</p>
          <div className="grid grid-cols-2 gap-2">
            {data.schoolReadiness.map((d) => (
              <div key={d.id} className="rounded-xl border bg-card px-3 py-2.5 flex items-center gap-2 text-sm">
                <span>
                  {d.status === "strong" ? "🟢" : d.status === "growing" ? "🟡" : "🔴"}
                </span>
                <span className="font-medium">{d.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Learning cards */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold px-0.5">Learning Plan</h2>
        {data.learningCards.map((card, i) => (
          <div key={i} className="rounded-[1.35rem] border bg-card p-5 space-y-3 shadow-sm">
            <p className="font-semibold">{card.goal}</p>
            <p className="text-sm text-muted-foreground">{card.why}</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span>Activity: {card.activity}</span>
              <span>{card.timeMinutes} min · {card.difficulty}</span>
              <span className="col-span-2">Toy: {card.toyNeeded}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {card.skills.map((s) => (
                <span key={s} className="text-xs rounded-full bg-muted px-2 py-0.5">{s}</span>
              ))}
            </div>
            <Button asChild variant="outline" className="w-full rounded-xl">
              <Link href={card.href}>Start Activity</Link>
            </Button>
          </div>
        ))}
        <Button asChild variant="ghost" className="w-full text-primary">
          <Link href="/learning-plan">Generate full learning plan →</Link>
        </Button>
      </section>

      {/* Timeline */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold px-0.5">Memory Timeline</h2>
        {data.timeline.length > 0 ? (
          <div className="space-y-0 border-l-2 border-primary/20 ml-3 pl-5">
            {data.timeline.map((entry) => (
              <div key={entry.id} className="relative pb-5 last:pb-0">
                <span className="absolute -left-[1.65rem] top-0 text-lg">{entry.emoji}</span>
                <p className="text-xs text-muted-foreground">{entry.when}</p>
                <p className="text-sm leading-snug mt-0.5">{entry.label}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.35rem] border border-dashed bg-muted/20 p-5 text-sm text-muted-foreground text-center">
            Your timeline will fill up as you complete missions and save memories.
          </div>
        )}
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href="/memory">View all memories</Link>
        </Button>
      </section>

      {/* Monthly letter */}
      {data.monthlyLetter && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold px-0.5">Monthly Growth Letter</h2>
          <div className="rounded-[1.35rem] border bg-gradient-to-br from-amber-50/60 to-background p-5">
            <p className="text-sm leading-relaxed whitespace-pre-line">{data.monthlyLetter}</p>
          </div>
          <Button asChild variant="ghost" className="w-full text-primary">
            <Link href="/weekly-report">Read full weekly report →</Link>
          </Button>
        </section>
      )}
    </div>
  );
}

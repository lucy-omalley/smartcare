"use client";

import type { VoiceUsageSnapshot } from "@/types/voice-usage";
import { cn } from "@/lib/utils";

interface VoiceUsageSummaryProps {
  usage: VoiceUsageSnapshot | null;
  className?: string;
  variant?: "default" | "bedtime";
}

function formatRemaining(remaining: number | null, label: string): string | null {
  if (remaining === null) return null;
  return `${remaining} ${label}${remaining === 1 ? "" : "s"} left this month`;
}

export function VoiceUsageSummary({ usage, className, variant = "default" }: VoiceUsageSummaryProps) {
  if (!usage || usage.tier === "unlimited") return null;

  const narrations = formatRemaining(
    usage.familyNarrationsRemainingThisMonth,
    "new family narration"
  );
  const clones =
    usage.limits.voiceClonesPerMonth > 0
      ? formatRemaining(usage.voiceClonesRemainingThisMonth, "voice clone")
      : null;
  const profiles = formatRemaining(usage.voiceProfilesRemaining, "voice profile slot");

  const parts = [narrations, clones, profiles].filter(Boolean);
  if (parts.length === 0) return null;

  const isBedtime = variant === "bedtime";

  return (
    <div
      className={cn(
        "rounded-xl px-3 py-2 text-[11px] leading-relaxed",
        isBedtime
          ? "text-indigo-200/80 bg-white/5 border border-white/10"
          : "text-muted-foreground bg-muted/40 border border-border/60",
        className
      )}
    >
      <p className={cn("font-medium mb-0.5", isBedtime ? "text-indigo-100" : "text-foreground")}>
        Voice usage {usage.tier === "beta" ? "(beta limits)" : ""}
      </p>
      <ul className="space-y-0.5 list-disc list-inside">
        {parts.map((part) => (
          <li key={part}>{part}</li>
        ))}
      </ul>
      <p className="mt-1 opacity-80">Replays of stories already narrated in your voice are free.</p>
    </div>
  );
}

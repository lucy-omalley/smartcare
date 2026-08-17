"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export interface VoiceProfileOption {
  id: string;
  name: string;
  relationship: string;
  avatarEmoji: string;
  status: string;
  provider?: string;
}

interface NarratorPickerProps {
  value: { type: "standard" } | { type: "family"; voiceProfileId: string };
  onChange: (value: NarratorPickerProps["value"]) => void;
  voices: VoiceProfileOption[];
  premiumLocked?: boolean;
  variant?: "default" | "bedtime";
  className?: string;
}

function statusLabel(status: string): string {
  switch (status) {
    case "READY":
      return "Ready";
    case "PROCESSING":
      return "Processing…";
    case "FAILED":
      return "Needs re-recording";
    case "RECORDING":
      return "Finish recording";
    default:
      return status.toLowerCase();
  }
}

export function NarratorPicker({
  value,
  onChange,
  voices,
  premiumLocked,
  variant = "default",
  className,
}: NarratorPickerProps) {
  const isBedtime = variant === "bedtime";
  const readyVoices = voices.filter((v) => v.status === "READY");
  const pendingVoices = voices.filter((v) => v.status !== "READY");

  const baseButton = cn(
    "rounded-2xl border p-3 text-left transition-colors touch-manipulation select-none",
    isBedtime
      ? "border-white/20 text-indigo-50 hover:bg-white/10 active:bg-white/15"
      : "border-border hover:bg-muted/50"
  );

  const selectedButton = isBedtime
    ? "!border-white !bg-white/25 ring-2 ring-white/40 shadow-lg shadow-indigo-950/40"
    : "border-primary bg-primary/10 ring-2 ring-primary/30";

  const unselectedButton = isBedtime ? "" : "border-border hover:bg-muted/50";

  const isStandardSelected = value.type === "standard";

  return (
    <div className={cn("space-y-2", className)}>
      <p
        className={cn(
          "text-xs font-medium uppercase tracking-wider",
          isBedtime ? "text-indigo-200/80" : "text-muted-foreground"
        )}
      >
        Choose narrator
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          aria-pressed={isStandardSelected}
          onClick={() => onChange({ type: "standard" })}
          className={cn(baseButton, isStandardSelected ? selectedButton : unselectedButton)}
        >
          <span className="text-xl" aria-hidden>
            🎧
          </span>
          <p className="text-sm font-medium mt-1">Original narrator</p>
          <p className={cn("text-[10px]", isBedtime ? "text-indigo-200/70" : "text-muted-foreground")}>
            Warm standard voice
          </p>
        </button>

        {readyVoices.map((voice) => {
          const isSelected = value.type === "family" && value.voiceProfileId === voice.id;
          const locked = premiumLocked;

          return (
            <button
              key={voice.id}
              type="button"
              aria-pressed={isSelected}
              disabled={locked}
              onClick={() => {
                if (locked) return;
                onChange({ type: "family", voiceProfileId: voice.id });
              }}
              className={cn(
                baseButton,
                isSelected ? selectedButton : unselectedButton,
                locked && "opacity-60 cursor-not-allowed"
              )}
            >
              <span className="text-xl" aria-hidden>
                {voice.avatarEmoji}
              </span>
              <p className="text-sm font-medium mt-1">{voice.name}</p>
              <p className={cn("text-[10px] capitalize", isBedtime ? "text-indigo-200/70" : "text-muted-foreground")}>
                {voice.relationship.toLowerCase()}
                {voice.provider && voice.provider !== "elevenlabs" ? " · preset" : voice.provider === "elevenlabs" ? " · cloned" : ""}
              </p>
            </button>
          );
        })}

        {pendingVoices.map((voice) => (
          <div
            key={voice.id}
            className={cn(
              baseButton,
              "opacity-70 cursor-not-allowed",
              isBedtime ? "border-white/10 bg-black/10" : "bg-muted/30"
            )}
            aria-disabled
          >
            <span className="text-xl" aria-hidden>
              {voice.avatarEmoji}
            </span>
            <p className="text-sm font-medium mt-1">{voice.name}</p>
            <p className={cn("text-[10px]", isBedtime ? "text-indigo-200/70" : "text-muted-foreground")}>
              {statusLabel(voice.status)}
            </p>
          </div>
        ))}
      </div>

      {premiumLocked && readyVoices.length > 0 && (
        <p className={cn("text-[10px]", isBedtime ? "text-indigo-200/70" : "text-muted-foreground")}>
          Family voices are a Premium feature.{" "}
          <Link href="/billing" className="underline underline-offset-2">
            Upgrade
          </Link>
        </p>
      )}

      {!premiumLocked && readyVoices.length === 0 && voices.length > 0 && (
        <p className={cn("text-[10px] leading-relaxed", isBedtime ? "text-indigo-200/70" : "text-muted-foreground")}>
          Your voice isn&apos;t ready yet.{" "}
          <Link href="/stories/voice" className="underline underline-offset-2">
            Open voice library
          </Link>{" "}
          to finish recording or wait for processing.
        </p>
      )}

      {!premiumLocked && voices.length === 0 && (
        <p className={cn("text-[10px] leading-relaxed", isBedtime ? "text-indigo-200/70" : "text-muted-foreground")}>
          No family voice yet.{" "}
          <Link href="/stories/voice/record" className="underline underline-offset-2">
            Record your voice
          </Link>{" "}
          to narrate stories.
        </p>
      )}
    </div>
  );
}

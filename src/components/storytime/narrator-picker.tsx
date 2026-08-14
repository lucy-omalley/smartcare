"use client";

import { cn } from "@/lib/utils";

export interface VoiceProfileOption {
  id: string;
  name: string;
  relationship: string;
  avatarEmoji: string;
  status: string;
}

interface NarratorPickerProps {
  value: { type: "standard" } | { type: "family"; voiceProfileId: string };
  onChange: (value: NarratorPickerProps["value"]) => void;
  voices: VoiceProfileOption[];
  premiumLocked?: boolean;
  className?: string;
}

export function NarratorPicker({ value, onChange, voices, premiumLocked, className }: NarratorPickerProps) {
  const readyVoices = voices.filter((v) => v.status === "READY");

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Choose narrator</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange({ type: "standard" })}
          className={cn(
            "rounded-2xl border p-3 text-left transition-colors",
            value.type === "standard" ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"
          )}
        >
          <span className="text-xl" aria-hidden>🎧</span>
          <p className="text-sm font-medium mt-1">Original narrator</p>
          <p className="text-[10px] text-muted-foreground">Warm standard voice</p>
        </button>

        {readyVoices.map((voice) => (
          <button
            key={voice.id}
            type="button"
            disabled={premiumLocked}
            onClick={() => onChange({ type: "family", voiceProfileId: voice.id })}
            className={cn(
              "rounded-2xl border p-3 text-left transition-colors",
              value.type === "family" && value.voiceProfileId === voice.id
                ? "border-primary bg-primary/10"
                : "border-border hover:bg-muted/50",
              premiumLocked && "opacity-60"
            )}
          >
            <span className="text-xl" aria-hidden>{voice.avatarEmoji}</span>
            <p className="text-sm font-medium mt-1">{voice.name}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{voice.relationship.toLowerCase()}</p>
          </button>
        ))}
      </div>
      {premiumLocked && (
        <p className="text-[10px] text-muted-foreground">Family voices are a Premium feature.</p>
      )}
    </div>
  );
}

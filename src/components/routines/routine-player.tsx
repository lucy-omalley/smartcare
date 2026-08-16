"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VisualRoutineView } from "@/types/visual-routine";
import { Volume2, Check, SkipForward, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { cacheRoutineOffline } from "@/lib/routines/offline-cache";

interface RoutinePlayerProps {
  routine: VisualRoutineView;
  voiceProfileId?: string | null;
  highContrast?: boolean;
}

export function RoutinePlayer({ routine, voiceProfileId, highContrast }: RoutinePlayerProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [celebrating, setCelebrating] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);
  const startRef = useRef(Date.now());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const steps = routine.steps;
  const step = steps[stepIndex];
  const progress = steps.length > 0 ? Math.round((completed.size / steps.length) * 100) : 0;
  const isLast = stepIndex >= steps.length - 1;
  const allDone = completed.size >= steps.length;

  useEffect(() => {
    cacheRoutineOffline(routine);
    trackEvent("routine_started", { routineId: routine.id });
  }, [routine]);

  const playVoice = useCallback(async () => {
    if (!step) return;
    setPlayingAudio(true);
    try {
      const res = await fetch("/api/routines/step-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: step.voiceInstruction ?? step.instruction,
          voiceProfileId: voiceProfileId ?? undefined,
        }),
      });
      if (!res.ok) throw new Error("Could not load voice");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioRef.current?.pause();
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setPlayingAudio(false);
      };
      await audio.play();
    } catch {
      toast.error("Voice playback unavailable");
      setPlayingAudio(false);
    }
  }, [step, voiceProfileId]);

  const finishRoutine = useCallback(async () => {
    setCelebrating(true);
    const durationSeconds = Math.round((Date.now() - startRef.current) / 1000);
    await fetch(`/api/routines/${routine.id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stepsCompleted: completed.size,
        stepsTotal: steps.length,
        durationSeconds,
        skippedStepIds: Array.from(skipped),
        completed: completed.size >= steps.length,
      }),
    });
    trackEvent("routine_completed", { routineId: routine.id });
  }, [routine.id, completed.size, skipped, steps.length]);

  const completeStep = () => {
    if (!step) return;
    setCompleted((prev) => new Set(prev).add(step.id));
    if (isLast) {
      void finishRoutine();
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const skipStep = () => {
    if (!step) return;
    setSkipped((prev) => new Set(prev).add(step.id));
    if (isLast) {
      void finishRoutine();
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  if (celebrating || allDone) {
    const hasStoryStep = steps.some((s) => s.isStoryTimeStep);
    return (
      <div className={cn("rounded-3xl p-8 text-center space-y-6 animate-in fade-in", highContrast ? "bg-black text-white" : "bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/40 dark:to-orange-950/30")}>
        <PartyPopper className="h-16 w-16 mx-auto text-amber-500" />
        <h2 className="text-3xl font-bold">Amazing job{routine.childName ? `, ${routine.childName}` : ""}!</h2>
        {routine.rewardsEnabled && (
          <p className="text-lg">You earned {steps.length} stars! ⭐</p>
        )}
        {hasStoryStep && (
          <Button asChild size="lg" className="rounded-2xl w-full max-w-xs mx-auto">
            <Link href="/stories/create">📖 Start Story Time</Link>
          </Button>
        )}
        <Button variant="outline" className="rounded-2xl" asChild>
          <Link href="/routines">Back to routines</Link>
        </Button>
      </div>
    );
  }

  if (!step) return null;

  return (
    <div className={cn("rounded-3xl overflow-hidden", highContrast ? "bg-black text-white border-4 border-white" : "bg-gradient-to-b from-sky-50 to-indigo-50 dark:from-sky-950/30 dark:to-indigo-950/40 border")}>
      <div className="p-4">
        <div className="flex justify-between text-xs font-medium mb-2 opacity-70">
          <span>Step {stepIndex + 1} of {steps.length}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-3 rounded-full bg-white/50 overflow-hidden mb-6">
          <div className="h-full bg-primary transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
        </div>

        <div className="text-center space-y-4 py-4">
          <div className="text-7xl animate-bounce" style={{ animationDuration: "2s" }} aria-hidden>{step.iconEmoji}</div>
          <h2 className="text-2xl font-bold leading-snug">{step.title}</h2>
          <p className="text-lg leading-relaxed max-w-sm mx-auto opacity-90">{step.instruction}</p>
          <p className="text-sm opacity-60">⏱ ~{step.durationMinutes} min · {step.rewardEmoji} reward</p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4">
          <Button
            variant="outline"
            size="lg"
            className="rounded-2xl h-14 touch-manipulation"
            disabled={playingAudio}
            onClick={() => void playVoice()}
          >
            <Volume2 className="h-5 w-5 mr-2" />
            {playingAudio ? "Playing…" : "Listen"}
          </Button>
          <Button
            size="lg"
            className="rounded-2xl h-14 touch-manipulation"
            onClick={completeStep}
          >
            <Check className="h-5 w-5 mr-2" />
            Done!
          </Button>
        </div>
        <Button variant="ghost" className="w-full mt-2 rounded-xl text-xs" onClick={skipStep}>
          <SkipForward className="h-3.5 w-3.5 mr-1" /> Skip this step
        </Button>
      </div>
    </div>
  );
}

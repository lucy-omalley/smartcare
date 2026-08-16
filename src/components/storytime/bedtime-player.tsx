"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { StarsBackground } from "@/components/storytime/stars-background";
import { NarratorPicker, type VoiceProfileOption } from "@/components/storytime/narrator-picker";
import { StoryListenButton } from "@/components/story/story-listen-button";
import { useStoryAudio } from "@/hooks/use-story-audio";
import { Heart, Moon, Timer, Download } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BedtimePlayerProps {
  storyId: string;
  title: string;
  storyText: string;
  moralTheme?: string | null;
  voices: VoiceProfileOption[];
  isPremium: boolean;
  familyVoiceEnabled?: boolean;
  isFavorite: boolean;
  initialNarrator?: { type: "standard" } | { type: "family"; voiceProfileId: string };
  onToggleFavorite: (next: boolean) => void;
}

export function BedtimePlayer({
  storyId,
  title,
  storyText,
  moralTheme,
  voices,
  isPremium,
  familyVoiceEnabled,
  isFavorite,
  initialNarrator,
  onToggleFavorite,
}: BedtimePlayerProps) {
  const [narrator, setNarrator] = useState(initialNarrator ?? { type: "standard" as const });
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [showText, setShowText] = useState(false);
  const playStartedRef = useRef(false);
  const storyAudio = useStoryAudio();
  const canUseFamilyVoice = familyVoiceEnabled ?? isPremium;

  useEffect(() => {
    if (!initialNarrator) return;
    setNarrator(initialNarrator);
  }, [initialNarrator]);

  const audioUrl = `/api/storytime/stories/${storyId}/audio${
    narrator.type === "family" ? `?voiceProfileId=${narrator.voiceProfileId}` : ""
  }`;

  const fetchAudio = useCallback(
    async (signal?: AbortSignal) => {
      const res = await fetch(audioUrl, { signal });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Could not load narration");
      }
      return res.blob();
    },
    [audioUrl]
  );

  const saveNarrator = useCallback(async (selection: typeof narrator) => {
    await fetch("/api/storytime/narrator", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selection }),
    });
    trackEvent("narrator_selected", {
      type: selection.type,
      voiceProfileId: selection.type === "family" ? selection.voiceProfileId : null,
    });
  }, []);

  const handleNarratorChange = (selection: typeof narrator) => {
    setNarrator(selection);
    void saveNarrator(selection);
    storyAudio.stop();
    const label =
      selection.type === "standard"
        ? "Original narrator"
        : voices.find((v) => v.id === selection.voiceProfileId)?.name ?? "Family voice";
    toast.success(`Narrator: ${label}`);
  };

  const handleListen = async () => {
    if (!playStartedRef.current) {
      playStartedRef.current = true;
      trackEvent("family_story_played", { storyId, narratorType: narrator.type });
      trackEvent("bedtime_mode_opened", { storyId });
    }
    await storyAudio.toggle(() => fetchAudio());
  };

  const reportPlay = useCallback(
    async (completed: boolean, listenedSeconds: number) => {
      await fetch(`/api/storytime/stories/${storyId}/play`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceProfileId: narrator.type === "family" ? narrator.voiceProfileId : null,
          narratorType: narrator.type === "family" ? "FAMILY_VOICE" : "STANDARD",
          listenedSeconds,
          completed,
        }),
      });
      if (completed) trackEvent("family_story_completed", { storyId });
    },
    [storyId, narrator]
  );

  useEffect(() => {
    if (!sleepTimer) return;
    const id = window.setTimeout(() => {
      storyAudio.stop();
      toast.info("Sleep timer — sweet dreams.");
    }, sleepTimer * 60_000);
    return () => window.clearTimeout(id);
  }, [sleepTimer, storyAudio]);

  useEffect(() => {
    return () => {
      if (playStartedRef.current) {
        void reportPlay(false, 0);
      }
      storyAudio.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const downloadAudio = async () => {
    try {
      const blob = await fetchAudio();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/\s+/g, "-").slice(0, 40)}.mp3`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    }
  };

  return (
    <div className={cn("relative min-h-[70vh] rounded-3xl overflow-hidden text-indigo-50")} style={{ background: "linear-gradient(180deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%)" }}>
      <StarsBackground />
      <div className="relative z-10 p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm opacity-90">
            <Moon className="h-4 w-4" />
            Bedtime mode
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="text-indigo-100 hover:bg-white/10 rounded-full" onClick={() => onToggleFavorite(!isFavorite)}>
              <Heart className={cn("h-4 w-4", isFavorite && "fill-rose-300 text-rose-300")} />
            </Button>
            {isPremium && (
              <Button size="icon" variant="ghost" className="text-indigo-100 hover:bg-white/10 rounded-full" onClick={downloadAudio}>
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="text-center space-y-2 pt-4">
          <h1 className="text-2xl font-bold leading-snug">{title}</h1>
          {moralTheme && <p className="text-xs opacity-75">💡 {moralTheme}</p>}
        </div>

        <NarratorPicker
          value={narrator}
          onChange={handleNarratorChange}
          voices={voices}
          premiumLocked={!canUseFamilyVoice}
          variant="bedtime"
        />

        <div className="flex flex-col items-center gap-4 py-6">
          <StoryListenButton
            active={storyAudio.isActive}
            onToggle={handleListen}
            className="scale-125 rounded-full h-14 px-8 text-base"
            size="default"
          />
          <p className="text-xs opacity-70">Tap to listen</p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Timer className="h-3.5 w-3.5 opacity-70" />
          {[5, 10, 15].map((min) => (
            <button
              key={min}
              type="button"
              onClick={() => setSleepTimer(sleepTimer === min ? null : min)}
              className={cn(
                "text-[10px] px-2 py-1 rounded-full border border-white/20",
                sleepTimer === min && "bg-white/20"
              )}
            >
              {min}m
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          className="w-full text-indigo-200 hover:bg-white/10 rounded-xl text-xs"
          onClick={() => setShowText((s) => !s)}
        >
          {showText ? "Hide story text" : "Read along"}
        </Button>

        {showText && (
          <div className="rounded-2xl bg-black/20 p-4 text-sm leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line">
            {storyText}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Button } from "@/components/ui/button";
import { StarsBackground } from "@/components/storytime/stars-background";
import { NarratorPicker, type VoiceProfileOption } from "@/components/storytime/narrator-picker";
import { VoiceUsageSummary } from "@/components/storytime/voice-usage-summary";
import type { VoiceUsageSnapshot } from "@/types/voice-usage";
import { StoryListenButton } from "@/components/story/story-listen-button";
import { useStoryAudio } from "@/hooks/use-story-audio";
import {
  getCachedFamilyStoryAudio,
  getFamilyStoryAudioFetch,
  prefetchFamilyStoryAudio,
  type FamilyNarratorSelection,
} from "@/lib/family-story-audio-prefetch";
import { Heart, Moon, Timer, Download, Trash2 } from "lucide-react";
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
  voiceProviderConfigured?: "openai" | "elevenlabs";
  voiceUsage?: VoiceUsageSnapshot | null;
  isFavorite: boolean;
  initialNarrator?: FamilyNarratorSelection;
  onToggleFavorite: (next: boolean) => void;
  onDelete?: () => void | Promise<void>;
}

function applyVoiceEngineHint(
  engine: string | null,
  selection: FamilyNarratorSelection,
  setVoiceEngineHint: (hint: string | null) => void,
  cloneConfirmedRef: MutableRefObject<string | null>
) {
  if (engine === "openai-preset") {
    setVoiceEngineHint(
      "This story is using a preset AI voice. Open Voice library and tap Clone my voice to upgrade to your real ElevenLabs narration."
    );
  } else if (engine === "elevenlabs") {
    if (selection.type === "family") {
      cloneConfirmedRef.current = selection.voiceProfileId;
    }
    setVoiceEngineHint(null);
  } else {
    setVoiceEngineHint(null);
  }
}

export function BedtimePlayer({
  storyId,
  title,
  storyText,
  moralTheme,
  voices,
  isPremium,
  familyVoiceEnabled,
  voiceProviderConfigured = "openai",
  voiceUsage,
  isFavorite,
  initialNarrator,
  onToggleFavorite,
  onDelete,
}: BedtimePlayerProps) {
  const [narrator, setNarrator] = useState<FamilyNarratorSelection>(initialNarrator ?? { type: "standard" });
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [showText, setShowText] = useState(true);
  const [voiceEngineHint, setVoiceEngineHint] = useState<string | null>(null);
  const [prefetching, setPrefetching] = useState(false);
  const [audioCached, setAudioCached] = useState(false);
  const playStartedRef = useRef(false);
  const cloneConfirmedRef = useRef<string | null>(null);
  const narratorRef = useRef(narrator);
  const storyAudio = useStoryAudio({
    onError: (message) => toast.error(message),
  });
  const canUseFamilyVoice = familyVoiceEnabled ?? isPremium;

  narratorRef.current = narrator;

  useEffect(() => {
    if (!initialNarrator) return;
    setNarrator(initialNarrator);
  }, [initialNarrator]);

  const selectedFamilyVoice = useMemo(() => {
    if (narrator.type !== "family") return null;
    return voices.find((v) => v.id === narrator.voiceProfileId) ?? null;
  }, [narrator, voices]);

  const presetVoiceSelected =
    narrator.type === "family" &&
    selectedFamilyVoice?.status === "READY" &&
    selectedFamilyVoice.provider !== "elevenlabs";

  useEffect(() => {
    if (narrator.type === "family" && cloneConfirmedRef.current === narrator.voiceProfileId) {
      setVoiceEngineHint(null);
      return;
    }
    if (!presetVoiceSelected) {
      setVoiceEngineHint(null);
      return;
    }
    const message =
      voiceProviderConfigured === "elevenlabs"
        ? "This story will use a preset AI voice until your voice is cloned. Open Voice library and tap Clone my voice, or press Listen — we'll clone automatically on first play."
        : "This story uses a preset AI voice (not your recording). Open Voice library and tap Clone my voice once ElevenLabs cloning is enabled.";
    setVoiceEngineHint(message);
  }, [presetVoiceSelected, voiceProviderConfigured, selectedFamilyVoice?.id, narrator]);

  useEffect(() => {
    const cached = getCachedFamilyStoryAudio(storyId, narrator);
    setAudioCached(!!cached);
    if (cached) {
      applyVoiceEngineHint(cached.voiceEngine, narrator, setVoiceEngineHint, cloneConfirmedRef);
      return;
    }

    setPrefetching(true);
    prefetchFamilyStoryAudio(storyId, narrator)
      .then((entry) => {
        setAudioCached(true);
        applyVoiceEngineHint(entry.voiceEngine, narrator, setVoiceEngineHint, cloneConfirmedRef);
      })
      .catch(() => {
        setAudioCached(false);
      })
      .finally(() => setPrefetching(false));
  }, [storyId, narrator]);

  const fetchNarration = useCallback(
    async (signal?: AbortSignal) => {
      const selection = narratorRef.current;
      const { blob, voiceEngine } = await getFamilyStoryAudioFetch(storyId, selection, signal);
      applyVoiceEngineHint(voiceEngine, selection, setVoiceEngineHint, cloneConfirmedRef);
      return blob;
    },
    [storyId]
  );

  const saveNarrator = useCallback(async (selection: FamilyNarratorSelection) => {
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

  const handleNarratorChange = (selection: FamilyNarratorSelection) => {
    cloneConfirmedRef.current = null;
    setNarrator(selection);
    setAudioCached(false);
    void saveNarrator(selection);
    storyAudio.stop();
    setVoiceEngineHint(null);
    const label =
      selection.type === "standard"
        ? "Original narrator"
        : voices.find((v) => v.id === selection.voiceProfileId)?.name ?? "Family voice";
    toast.success(`Narrator: ${label}`);
  };

  const handleListen = async () => {
    const selection = narratorRef.current;
    if (!playStartedRef.current) {
      playStartedRef.current = true;
      trackEvent("family_story_played", { storyId, narratorType: selection.type });
      trackEvent("bedtime_mode_opened", { storyId });
    }
    try {
      await storyAudio.toggle((signal) => fetchNarration(signal));
    } catch {
      // Errors surfaced via useStoryAudio onError.
    }
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
      const { blob } = await getFamilyStoryAudioFetch(storyId, narratorRef.current);
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

  const listenLoading = storyAudio.isLoading || (prefetching && !audioCached);
  const listenHint = listenLoading
    ? audioCached
      ? "Starting playback…"
      : "Preparing narration — first listen may take up to a minute…"
    : audioCached
      ? "Ready — tap to listen"
      : "Tap to listen";

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
            {onDelete && (
              <Button
                size="icon"
                variant="ghost"
                className="text-indigo-100 hover:bg-white/10 hover:text-rose-200 rounded-full"
                onClick={() => void onDelete()}
                aria-label="Delete story"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="text-center space-y-2 pt-2">
          <h1 className="text-2xl font-bold leading-snug">{title}</h1>
          {moralTheme && <p className="text-xs opacity-75">💡 {moralTheme}</p>}
        </div>

        {showText && (
          <div className="rounded-2xl bg-black/20 p-4 text-sm leading-relaxed max-h-56 overflow-y-auto whitespace-pre-line">
            {storyText}
          </div>
        )}

        <NarratorPicker
          value={narrator}
          onChange={handleNarratorChange}
          voices={voices}
          premiumLocked={!canUseFamilyVoice}
          variant="bedtime"
        />

        {narrator.type === "family" && voiceUsage && (
          <VoiceUsageSummary usage={voiceUsage} variant="bedtime" />
        )}

        {voiceEngineHint && (
          <p className="text-[11px] leading-relaxed text-amber-100/90 bg-amber-500/10 border border-amber-200/20 rounded-xl px-3 py-2">
            {voiceEngineHint}{" "}
            <Link href="/stories/voice" className="underline underline-offset-2 text-amber-50">
              Voice library
            </Link>
          </p>
        )}

        <div className="flex flex-col items-center gap-3 py-4">
          <StoryListenButton
            active={storyAudio.isActive}
            loading={listenLoading && !storyAudio.isPlaying}
            onToggle={handleListen}
            className="scale-125 rounded-full h-14 px-8 text-base"
            size="default"
          />
          <p className="text-xs opacity-70 text-center px-4">{listenHint}</p>
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
          {showText ? "Hide story text" : "Show story text"}
        </Button>
      </div>
    </div>
  );
}

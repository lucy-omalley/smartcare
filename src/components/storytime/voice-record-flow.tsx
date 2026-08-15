"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Mic, Square, Loader2, CheckCircle2, Sparkles, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import type { VoiceRelationship } from "@prisma/client";
import { CONSENT_TEXT } from "@/lib/voice/types";
import { RELATIONSHIP_OPTIONS, VOICE_RECORDING_PARAGRAPHS } from "@/lib/voice/recording-script";
import {
  checkMicrophoneSupport,
  microphoneErrorMessage,
  pickRecordingMimeType,
} from "@/lib/voice/microphone";

type Step = "intro" | "consent" | "record" | "processing" | "ready";

interface VoiceRecordFlowProps {
  onComplete?: (profileId: string) => void;
  onCancel?: () => void;
}

export function VoiceRecordFlow({ onComplete, onCancel }: VoiceRecordFlowProps) {
  const [step, setStep] = useState<Step>("intro");
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<VoiceRelationship>("MUM");
  const [consent, setConsent] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [paragraphIndex, setParagraphIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [micHint, setMicHint] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef(0);

  const requiredSamples = 6;
  const progress = Math.min(100, Math.round((savedCount / VOICE_RECORDING_PARAGRAPHS.length) * 100));

  const createProfile = useCallback(async () => {
    const res = await fetch("/api/voice/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, relationship, consentGiven: consent }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Could not create profile");
    setProfileId(data.profile.id);
    trackEvent("voice_profile_created", { relationship });
    trackEvent("voice_recording_started");
    return data.profile.id as string;
  }, [name, relationship, consent]);

  const uploadSample = async (pid: string, index: number, blob: Blob, durationMs: number) => {
    const form = new FormData();
    form.append("paragraphIndex", String(index));
    form.append("durationMs", String(durationMs));
    form.append("audio", blob, `sample-${index}.webm`);

    const res = await fetch(`/api/voice/profiles/${pid}/samples`, { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Upload failed");
    setSavedCount(data.recordingCount);
    return data;
  };

  const startRecording = async () => {
    const support = checkMicrophoneSupport();
    if (!support.ok) {
      toast.error(support.reason, { description: support.hint });
      setMicHint(support.hint ?? support.reason);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const mimeType = pickRecordingMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      startTimeRef.current = Date.now();
      setMicHint(null);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blobType = mimeType?.split(";")[0] ?? "audio/webm";
        const blob = new Blob(chunksRef.current, { type: blobType });
        const durationMs = Date.now() - startTimeRef.current;
        if (blob.size < 500 || durationMs < 400) {
          toast.error("Recording was too short. Hold the button and read the full paragraph.");
          return;
        }
        let pid = profileId;
        if (!pid) {
          setUploading(true);
          try {
            pid = await createProfile();
          } finally {
            setUploading(false);
          }
        }
        if (!pid) return;

        setUploading(true);
        try {
          await uploadSample(pid, paragraphIndex, blob, durationMs);
          if (paragraphIndex < VOICE_RECORDING_PARAGRAPHS.length - 1) {
            setParagraphIndex((i) => i + 1);
          } else {
            toast.success("All paragraphs recorded!");
          }
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Upload failed");
        } finally {
          setUploading(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (error) {
      const { title, hint } = microphoneErrorMessage(error);
      toast.error(title, { description: hint });
      setMicHint(hint ?? title);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const processVoice = async () => {
    if (!profileId) return;
    setStep("processing");
    setProcessing(true);
    try {
      const res = await fetch(`/api/voice/profiles/${profileId}/process`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Processing failed");
      trackEvent("voice_profile_ready");
      trackEvent("premium_feature_used", { feature: "family_voice_storytime" });
      setStep("ready");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Processing failed");
      setStep("record");
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (step !== "record") return;
    const support = checkMicrophoneSupport();
    if (!support.ok) {
      setMicHint(support.hint ?? support.reason);
    }
  }, [step]);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (step === "intro") {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 space-y-2">
          <div className="flex items-center gap-2 text-primary font-medium">
            <Sparkles className="h-4 w-4" />
            Family Voice Storytime
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Record a short reading so Parenfy can narrate bedtime stories in your voice — a warm connection even when you&apos;re away.
          </p>
          <p className="text-xs text-muted-foreground">Estimated time: 2–5 minutes · {VOICE_RECORDING_PARAGRAPHS.length} short paragraphs</p>
        </div>
        <div className="space-y-2">
          <Label>Voice name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mum, Dad, Grandma" />
        </div>
        <div className="space-y-2">
          <Label>Relationship</Label>
          <div className="grid grid-cols-3 gap-2">
            {RELATIONSHIP_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRelationship(opt.value as VoiceRelationship)}
                className={`rounded-xl border p-2 text-xs ${relationship === opt.value ? "border-primary bg-primary/10" : ""}`}
              >
                {opt.emoji} {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" className="rounded-xl flex-1" onClick={onCancel}>Cancel</Button>
          )}
          <Button className="rounded-xl flex-1" disabled={!name.trim()} onClick={() => setStep("consent")}>
            Continue
          </Button>
        </div>
      </div>
    );
  }

  if (step === "consent") {
    return (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed">{CONSENT_TEXT}</p>
        <label className="flex items-start gap-3 rounded-xl border p-3 cursor-pointer">
          <Checkbox checked={consent} onCheckedChange={(v) => setConsent(Boolean(v))} className="mt-0.5" />
          <span className="text-sm">I agree — use my voice only for my family&apos;s stories on Parenfy.</span>
        </label>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl flex-1" onClick={() => setStep("intro")}>Back</Button>
          <Button className="rounded-xl flex-1" disabled={!consent} onClick={() => {
            setMicHint(null);
            setStep("record");
          }}>
            Start recording
          </Button>
        </div>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div className="text-center space-y-4 py-8">
        <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
        <p className="font-medium">Creating your voice profile…</p>
        <p className="text-sm text-muted-foreground">This usually takes under a minute.</p>
      </div>
    );
  }

  if (step === "ready") {
    return (
      <div className="text-center space-y-4 py-4">
        <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
        <p className="text-lg font-semibold">Voice ready!</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Next, create a bedtime story — then choose <strong className="text-foreground">{name}</strong> as the narrator to hear it in your voice.
        </p>
        <div className="rounded-xl border border-dashed border-muted-foreground/30 px-3 py-2 text-[11px] text-muted-foreground text-left leading-relaxed">
          <strong className="text-foreground">How it works:</strong> Parenfy writes the story with AI. Your recorded voice reads it aloud when you tap Listen.
        </div>
        <Button asChild className="w-full rounded-xl">
          <Link href="/stories/create">
            <BookOpen className="h-4 w-4 mr-2" />
            Create a bedtime story
          </Link>
        </Button>
        <Button variant="outline" className="w-full rounded-xl" asChild>
          <Link href="/stories/voice">Back to voice library</Link>
        </Button>
      </div>
    );
  }

  const paragraph = VOICE_RECORDING_PARAGRAPHS[paragraphIndex];

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Paragraph {paragraphIndex + 1} of {VOICE_RECORDING_PARAGRAPHS.length}</span>
          <span>{savedCount} saved</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="rounded-2xl bg-muted/40 p-4 text-sm leading-relaxed min-h-[120px]">
        {paragraph}
      </div>

      <div className="rounded-xl border border-dashed border-muted-foreground/30 px-3 py-2 text-[11px] text-muted-foreground leading-relaxed">
        When you tap the button below, your browser will ask to use the microphone. Choose <strong className="text-foreground">Allow</strong> for parenfy.com.
      </div>

      <div className="flex justify-center">
        {recording ? (
          <Button size="lg" variant="destructive" className="rounded-full h-16 w-16" onClick={stopRecording}>
            <Square className="h-6 w-6" />
          </Button>
        ) : (
          <Button
            size="lg"
            className="rounded-full h-16 w-16"
            disabled={uploading}
            onClick={startRecording}
          >
            {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Mic className="h-6 w-6" />}
          </Button>
        )}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {recording ? "Tap to stop" : "Tap to record this paragraph"}
      </p>

      {micHint && (
        <p className="text-center text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 rounded-xl px-3 py-2 leading-relaxed">
          {micHint}
        </p>
      )}

      {savedCount >= requiredSamples && (
        <Button className="w-full rounded-xl" onClick={processVoice} disabled={processing}>
          {processing ? "Processing…" : "Finish & create voice profile"}
        </Button>
      )}
    </div>
  );
}

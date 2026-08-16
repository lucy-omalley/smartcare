"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { RoutineFeatures } from "@/types/visual-routine";
import {
  ROUTINE_CHALLENGE_OPTIONS,
  ROUTINE_INTEREST_OPTIONS,
  ROUTINE_LENGTH_OPTIONS,
  ROUTINE_TEMPLATE_META,
} from "@/lib/routines/constants";
import type { RoutineChallenge, RoutineLength, RoutineTemplateType } from "@prisma/client";
import { cn } from "@/lib/utils";

interface RoutineGeneratorFormProps {
  defaultChildName?: string;
  defaultChildAge?: string;
  features: RoutineFeatures;
  initialTemplate?: RoutineTemplateType;
}

export function RoutineGeneratorForm({
  defaultChildName = "",
  defaultChildAge = "",
  features,
  initialTemplate = "MORNING",
}: RoutineGeneratorFormProps) {
  const router = useRouter();
  const [templateType, setTemplateType] = useState<RoutineTemplateType>(initialTemplate);
  const [childName, setChildName] = useState(defaultChildName);
  const [childAge, setChildAge] = useState(defaultChildAge);
  const [interests, setInterests] = useState<string[]>([]);
  const [challenge, setChallenge] = useState<RoutineChallenge>("TRANSITIONS");
  const [length, setLength] = useState<RoutineLength>("MEDIUM");
  const [loading, setLoading] = useState(false);

  const toggleInterest = (value: string) => {
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value].slice(0, 3)
    );
  };

  const submit = async (useAi: boolean) => {
    if (!childName.trim()) {
      toast.error("Please enter your child's name");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateType,
          childName: childName.trim(),
          childAge: childAge.trim() || null,
          interests,
          challenge,
          length,
          useAi: useAi && features.aiPersonalization,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create routine");
      toast.success("Routine ready!");
      router.push(`/routines/${data.routine.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create routine");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Template</Label>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {(Object.keys(ROUTINE_TEMPLATE_META) as RoutineTemplateType[]).map((key) => {
            const meta = ROUTINE_TEMPLATE_META[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTemplateType(key)}
                className={cn(
                  "rounded-xl border p-2 text-left text-xs transition-colors",
                  templateType === key ? "border-primary bg-primary/10" : "hover:bg-muted/50"
                )}
              >
                <span className="text-lg mr-1">{meta.emoji}</span>
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Child name</Label>
          <Input value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="e.g. Lily" className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Age</Label>
          <Input value={childAge} onChange={(e) => setChildAge(e.target.value)} placeholder="e.g. 4" className="rounded-xl" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Favourite interests</Label>
        <div className="flex flex-wrap gap-2">
          {ROUTINE_INTEREST_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleInterest(opt.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs",
                interests.includes(opt.value) ? "border-primary bg-primary/10" : ""
              )}
            >
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Current challenge</Label>
        <div className="grid grid-cols-2 gap-2">
          {ROUTINE_CHALLENGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setChallenge(opt.value)}
              className={cn(
                "rounded-xl border p-2 text-xs text-left",
                challenge === opt.value ? "border-primary bg-primary/10" : ""
              )}
            >
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Routine length</Label>
        <div className="flex gap-2">
          {ROUTINE_LENGTH_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setLength(opt.value)}
              className={cn(
                "flex-1 rounded-xl border p-2 text-center text-xs",
                length === opt.value ? "border-primary bg-primary/10" : ""
              )}
            >
              <p className="font-medium">{opt.label}</p>
              <p className="text-muted-foreground">{opt.stepHint}</p>
            </button>
          ))}
        </div>
      </div>

      {features.routinesRemaining !== null && (
        <p className="text-xs text-muted-foreground text-center">
          {features.routinesRemaining} free routine{features.routinesRemaining === 1 ? "" : "s"} remaining
        </p>
      )}

      <Button
        className="w-full rounded-xl h-12"
        disabled={loading}
        onClick={() => void submit(true)}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
        {features.aiPersonalization ? "Generate with AI" : "Create from template"}
      </Button>

      {!features.aiPersonalization && (
        <Button variant="outline" className="w-full rounded-xl" disabled={loading} onClick={() => void submit(false)}>
          Use standard template (free)
        </Button>
      )}
    </div>
  );
}

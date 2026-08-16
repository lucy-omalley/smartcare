"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Lock } from "lucide-react";
import { toast } from "sonner";
import type { PosterFeatures } from "@/types/routine-poster";
import { POSTER_THEMES } from "@/lib/posters/themes";
import {
  POSTER_CATEGORY_OPTIONS,
  POSTER_COLOUR_OPTIONS,
  POSTER_GOAL_OPTIONS,
  POSTER_LAYOUT_META,
  FREE_POSTER_THEMES,
} from "@/lib/posters/constants";
import {
  ROUTINE_CHALLENGE_OPTIONS,
  ROUTINE_LENGTH_OPTIONS,
  ROUTINE_TEMPLATE_META,
} from "@/lib/routines/constants";
import type { PosterTheme, RoutineChallenge, RoutineLength, RoutineTemplateType } from "@prisma/client";
import { cn } from "@/lib/utils";

interface PosterGeneratorFormProps {
  defaultChildName?: string;
  defaultChildAge?: string;
  features: PosterFeatures;
  initialTemplate?: RoutineTemplateType;
}

export function PosterGeneratorForm({
  defaultChildName = "",
  defaultChildAge = "",
  features,
  initialTemplate = "MORNING",
}: PosterGeneratorFormProps) {
  const router = useRouter();
  const [templateType, setTemplateType] = useState<RoutineTemplateType>(initialTemplate);
  const [childName, setChildName] = useState(defaultChildName);
  const [childAge, setChildAge] = useState(defaultChildAge);
  const [childGender, setChildGender] = useState("");
  const [theme, setTheme] = useState<PosterTheme>("DINOSAUR");
  const [colours, setColours] = useState<string[]>([]);
  const [challenge, setChallenge] = useState<RoutineChallenge>("MORNING_CHAOS");
  const [length, setLength] = useState<RoutineLength>("MEDIUM");
  const [parentGoals, setParentGoals] = useState<string[]>(["INDEPENDENCE"]);
  const [layout, setLayout] = useState<keyof typeof POSTER_LAYOUT_META>("A4_PORTRAIT");
  const [loading, setLoading] = useState(false);

  const toggleGoal = (value: string) => {
    setParentGoals((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value].slice(0, 3)
    );
  };

  const toggleColour = (value: string) => {
    setColours((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value].slice(0, 2)
    );
  };

  const isThemeLocked = (t: PosterTheme) =>
    !features.unlimitedThemes && !FREE_POSTER_THEMES.includes(t);

  const isLayoutLocked = (key: keyof typeof POSTER_LAYOUT_META) => {
    const meta = POSTER_LAYOUT_META[key];
    return !features.isPremium && meta.premium;
  };

  const submit = async (useAi: boolean) => {
    if (!childName.trim()) {
      toast.error("Please enter your child's name");
      return;
    }
    if (isThemeLocked(theme)) {
      toast.error("Upgrade to Premium for this theme");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/posters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateType,
          childName: childName.trim(),
          childAge: childAge.trim() || null,
          childGender: childGender.trim() || null,
          theme,
          favouriteColours: colours,
          challenge,
          length,
          parentGoals,
          layout,
          useAi: useAi && features.aiPersonalization,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create poster");
      toast.success("Poster ready!");
      router.push(`/posters/${data.poster.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create poster");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Routine template</Label>
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
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
        <Label>Gender (optional)</Label>
        <Input value={childGender} onChange={(e) => setChildGender(e.target.value)} placeholder="e.g. girl" className="rounded-xl" />
      </div>

      <div className="space-y-2">
        <Label>Favourite theme</Label>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {(Object.keys(POSTER_THEMES) as PosterTheme[]).map((key) => {
            const meta = POSTER_THEMES[key];
            const locked = isThemeLocked(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => !locked && setTheme(key)}
                className={cn(
                  "rounded-xl border p-2 text-left text-xs transition-colors relative",
                  theme === key ? "border-primary bg-primary/10" : "hover:bg-muted/50",
                  locked && "opacity-60"
                )}
              >
                {locked && <Lock className="h-3 w-3 absolute top-2 right-2 text-muted-foreground" />}
                <span className="text-lg mr-1">{meta.emoji}</span>
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Favourite colours</Label>
        <div className="flex flex-wrap gap-2">
          {POSTER_COLOUR_OPTIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => toggleColour(c.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs border",
                colours.includes(c.value) && "ring-2 ring-primary"
              )}
              style={{ backgroundColor: `${c.hex}22`, borderColor: c.hex }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Current challenge</Label>
        <div className="flex flex-wrap gap-2">
          {ROUTINE_CHALLENGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setChallenge(opt.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs border",
                challenge === opt.value ? "border-primary bg-primary/10" : "hover:bg-muted/50"
              )}
            >
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Parent goals</Label>
        <div className="flex flex-wrap gap-2">
          {POSTER_GOAL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleGoal(opt.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs border",
                parentGoals.includes(opt.value) ? "border-primary bg-primary/10" : "hover:bg-muted/50"
              )}
            >
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Routine length</Label>
        <div className="grid grid-cols-3 gap-2">
          {ROUTINE_LENGTH_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setLength(opt.value)}
              className={cn(
                "rounded-xl border p-2 text-center text-xs",
                length === opt.value ? "border-primary bg-primary/10" : "hover:bg-muted/50"
              )}
            >
              <p className="font-medium">{opt.label}</p>
              <p className="text-muted-foreground">{opt.stepHint}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Poster layout</Label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(POSTER_LAYOUT_META) as Array<keyof typeof POSTER_LAYOUT_META>).map((key) => {
            const meta = POSTER_LAYOUT_META[key];
            const locked = isLayoutLocked(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => !locked && setLayout(key)}
                className={cn(
                  "rounded-xl border p-2 text-left text-xs relative",
                  layout === key ? "border-primary bg-primary/10" : "hover:bg-muted/50",
                  locked && "opacity-60"
                )}
              >
                {locked && <Lock className="h-3 w-3 absolute top-2 right-2" />}
                <p className="font-medium">{meta.label}</p>
                <p className="text-muted-foreground">{meta.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button
          className="rounded-xl h-12"
          disabled={loading}
          onClick={() => submit(true)}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
          {features.aiPersonalization ? "Generate AI Poster" : "Generate Poster (Template)"}
        </Button>
        {!features.aiPersonalization && (
          <p className="text-xs text-center text-muted-foreground">
            AI personalisation is Premium — using themed template
          </p>
        )}
      </div>
    </div>
  );
}

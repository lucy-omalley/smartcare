"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Lock } from "lucide-react";
import { toast } from "sonner";
import type { AdventureFeatures } from "@/types/adventure-journey";
import { POSTER_THEMES } from "@/lib/posters/themes";
import { POSTER_COLOUR_OPTIONS, FREE_POSTER_THEMES, NUMBER_OF_CHILDREN_OPTIONS } from "@/lib/posters/constants";
import { ROUTINE_LENGTH_OPTIONS } from "@/lib/routines/constants";
import {
  ADVENTURE_CHALLENGE_OPTIONS,
  ADVENTURE_FORMAT_OPTIONS,
  ADVENTURE_GOAL_OPTIONS,
  ADVENTURE_INTEREST_OPTIONS,
  STORY_THEME_OPTIONS,
} from "@/lib/adventure/constants";
import type {
  AdventureFormat,
  PosterParentGoal,
  PosterTheme,
  RoutineChallenge,
  RoutineLength,
  RoutineTemplateType,
  StoryTheme,
} from "@prisma/client";
import { cn } from "@/lib/utils";

interface AdventureGeneratorFormProps {
  defaultChildName?: string;
  defaultChildAge?: string;
  defaultInterests?: string[];
  features: AdventureFeatures;
}

export function AdventureGeneratorForm({
  defaultChildName = "",
  defaultChildAge = "",
  defaultInterests = [],
  features,
}: AdventureGeneratorFormProps) {
  const router = useRouter();
  const [childName, setChildName] = useState(defaultChildName);
  const [childAge, setChildAge] = useState(defaultChildAge);
  const [numberOfChildren, setNumberOfChildren] = useState(1);
  const [interests, setInterests] = useState<string[]>(
    defaultInterests.length ? defaultInterests.slice(0, 3) : ["dinosaurs"]
  );
  const [theme, setTheme] = useState<PosterTheme>("DINOSAUR");
  const [storyTheme, setStoryTheme] = useState<StoryTheme>("ADVENTURE");
  const [adventureFormat, setAdventureFormat] = useState<AdventureFormat>("STORY_BOOK");
  const [templateType, setTemplateType] = useState<RoutineTemplateType>("BEDTIME");
  const [favouriteColour, setFavouriteColour] = useState("");
  const [challenge, setChallenge] = useState<RoutineChallenge>("BEDTIME");
  const [length, setLength] = useState<RoutineLength>("MEDIUM");
  const [parentGoals, setParentGoals] = useState<string[]>(["INDEPENDENCE"]);
  const [loading, setLoading] = useState(false);

  const toggleInterest = (value: string, suggestedTheme: PosterTheme) => {
    setInterests((prev) => {
      const next = prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value].slice(0, 3);
      if (next.length && !prev.includes(value)) setTheme(suggestedTheme);
      return next.length ? next : [value];
    });
  };

  const toggleGoal = (value: string) => {
    setParentGoals((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value].slice(0, 2)
    );
  };

  const isThemeLocked = (t: PosterTheme) =>
    !features.unlimitedThemes && !FREE_POSTER_THEMES.includes(t);

  const isFormatLocked = (format: AdventureFormat) => {
    const opt = ADVENTURE_FORMAT_OPTIONS.find((o) => o.value === format);
    return Boolean(opt?.premium && !features.isPremium);
  };

  const submit = async (useAi: boolean) => {
    if (!childName.trim()) {
      toast.error("Please enter your child's name");
      return;
    }
    if (interests.length === 0) {
      toast.error("Pick at least one interest");
      return;
    }
    if (isThemeLocked(theme)) {
      toast.error("Upgrade to Premium for this theme");
      return;
    }
    if (isFormatLocked(adventureFormat)) {
      toast.error("Upgrade to Premium for this format");
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
          numberOfChildren,
          interests,
          theme,
          storyTheme,
          adventureFormat,
          favouriteColours: favouriteColour ? [favouriteColour] : [],
          challenge,
          length,
          parentGoals: parentGoals as PosterParentGoal[],
          useAi: useAi && features.aiPersonalization,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create adventure");
      toast.success("Your adventure is ready!");
      router.push(`/adventure-journey/${data.poster.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create adventure");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Child name</Label>
          <Input
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="e.g. Jack"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Age</Label>
          <Input
            value={childAge}
            onChange={(e) => setChildAge(e.target.value)}
            placeholder="e.g. 4"
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>What does your child love?</Label>
        <div className="flex flex-wrap gap-2">
          {ADVENTURE_INTEREST_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleInterest(opt.value, opt.theme)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs border",
                interests.includes(opt.value) ? "border-primary bg-primary/10" : "hover:bg-muted/50"
              )}
            >
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Current challenge</Label>
        <div className="flex flex-wrap gap-2">
          {ADVENTURE_CHALLENGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setChallenge(opt.value);
                setTemplateType(opt.template);
              }}
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
        <Label>Parent goal</Label>
        <div className="flex flex-wrap gap-2">
          {ADVENTURE_GOAL_OPTIONS.map((opt) => (
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
        <Label>Story theme</Label>
        <div className="flex flex-wrap gap-2">
          {STORY_THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStoryTheme(opt.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs border",
                storyTheme === opt.value ? "border-primary bg-primary/10" : "hover:bg-muted/50"
              )}
            >
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Adventure theme</Label>
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
          {(Object.keys(POSTER_THEMES) as PosterTheme[]).map((key) => {
            const meta = POSTER_THEMES[key];
            const locked = isThemeLocked(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => !locked && setTheme(key)}
                className={cn(
                  "rounded-xl border p-2 text-left text-xs relative",
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
        <Label>Print format</Label>
        <div className="grid grid-cols-1 gap-2">
          {ADVENTURE_FORMAT_OPTIONS.map((opt) => {
            const locked = isFormatLocked(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => !locked && setAdventureFormat(opt.value)}
                className={cn(
                  "rounded-xl border p-3 text-left text-xs relative",
                  adventureFormat === opt.value ? "border-primary bg-primary/10" : "hover:bg-muted/50",
                  locked && "opacity-60"
                )}
              >
                {locked && <Lock className="h-3 w-3 absolute top-3 right-3" />}
                <p className="font-medium">{opt.label}</p>
                <p className="text-muted-foreground">{opt.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Favourite colour</Label>
        <div className="flex flex-wrap gap-2">
          {POSTER_COLOUR_OPTIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setFavouriteColour(favouriteColour === c.value ? "" : c.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs border",
                favouriteColour === c.value && "ring-2 ring-primary"
              )}
              style={{ backgroundColor: `${c.hex}22`, borderColor: c.hex }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Number of children</Label>
        <div className="flex gap-2">
          {NUMBER_OF_CHILDREN_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNumberOfChildren(n)}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium",
                numberOfChildren === n ? "border-primary bg-primary/10" : "hover:bg-muted/50"
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Adventure length</Label>
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

      <Button className="rounded-xl h-12 w-full" disabled={loading} onClick={() => submit(true)}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Sparkles className="h-4 w-4 mr-2" />
        )}
        Generate adventure journey
      </Button>
      {!features.aiPersonalization && (
        <p className="text-xs text-center text-muted-foreground">
          AI personalisation is Premium — we&apos;ll use a themed adventure template tailored to your answers.
        </p>
      )}
    </div>
  );
}

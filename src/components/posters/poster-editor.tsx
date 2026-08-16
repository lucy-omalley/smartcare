"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GripVertical, Plus, Trash2, ChevronUp, ChevronDown, Lock } from "lucide-react";
import type { RoutinePosterView, PosterStepView, PosterFeatures } from "@/types/routine-poster";
import { STEP_ICON_OPTIONS, POSTER_COLOUR_OPTIONS, FREE_POSTER_THEMES } from "@/lib/posters/constants";
import { POSTER_THEMES } from "@/lib/posters/themes";
import type { PosterTheme } from "@prisma/client";
import { cn } from "@/lib/utils";

interface PosterEditorProps {
  poster: RoutinePosterView;
  features: PosterFeatures;
  onChange: (steps: PosterStepView[], meta?: Partial<RoutinePosterView>) => void;
}

export function PosterEditor({ poster, features, onChange }: PosterEditorProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [editingIcon, setEditingIcon] = useState<string | null>(null);

  const updateSteps = useCallback(
    (steps: PosterStepView[]) => onChange(steps),
    [onChange]
  );

  const isThemeLocked = (t: PosterTheme) =>
    !features.unlimitedThemes && !FREE_POSTER_THEMES.includes(t);

  const moveStep = (index: number, direction: -1 | 1) => {
    const next = [...poster.steps];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    updateSteps(next.map((s, i) => ({ ...s, orderIndex: i })));
  };

  const removeStep = (index: number) => {
    if (poster.steps.length <= 2) return;
    updateSteps(
      poster.steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, orderIndex: i }))
    );
  };

  const addStep = () => {
    const newStep: PosterStepView = {
      id: `temp-${Date.now()}`,
      orderIndex: poster.steps.length,
      title: "New Step",
      iconEmoji: "⭐",
      illustrationKey: null,
      isStoryTimeStep: false,
      isSongStep: false,
    };
    updateSteps([...poster.steps, newStep]);
  };

  const updateStep = (index: number, patch: Partial<PosterStepView>) => {
    updateSteps(
      poster.steps.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  };

  const onDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = [...poster.steps];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    updateSteps(next.map((s, i) => ({ ...s, orderIndex: i })));
    setDragIndex(null);
  };

  const setTheme = (t: PosterTheme) => {
    if (isThemeLocked(t)) return;
    onChange(poster.steps, { theme: t });
  };

  const setColour = (value: string) => {
    const current = poster.favouriteColours[0];
    onChange(poster.steps, {
      favouriteColours: current === value ? [] : [value],
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Routine title</Label>
        <Input
          value={poster.title}
          onChange={(e) => onChange(poster.steps, { title: e.target.value })}
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label>Routine goal</Label>
        <Input
          value={poster.routineGoal ?? ""}
          onChange={(e) => onChange(poster.steps, { routineGoal: e.target.value })}
          className="rounded-xl"
          placeholder="What this routine helps your child achieve"
        />
      </div>

      <div className="space-y-2">
        <Label>Celebration message</Label>
        <Input
          value={poster.celebrationText ?? ""}
          onChange={(e) => onChange(poster.steps, { celebrationText: e.target.value })}
          className="rounded-xl"
          placeholder="Fantastic job!"
        />
      </div>

      <div className="space-y-2">
        <Label>Theme</Label>
        <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto">
          {(Object.keys(POSTER_THEMES) as PosterTheme[]).map((key) => {
            const meta = POSTER_THEMES[key];
            const locked = isThemeLocked(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTheme(key)}
                className={cn(
                  "rounded-lg border p-1.5 text-center text-[10px] relative",
                  poster.theme === key ? "border-primary bg-primary/10" : "hover:bg-muted/50",
                  locked && "opacity-60"
                )}
              >
                {locked && <Lock className="h-2.5 w-2.5 absolute top-1 right-1" />}
                <span className="text-lg block">{meta.emoji}</span>
                {meta.label.split(" ")[0]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Accent colour</Label>
        <div className="flex flex-wrap gap-2">
          {POSTER_COLOUR_OPTIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColour(c.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs border",
                poster.favouriteColours[0] === c.value && "ring-2 ring-primary"
              )}
              style={{ backgroundColor: `${c.hex}22`, borderColor: c.hex }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Steps — drag to reorder</Label>
          <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={addStep}>
            <Plus className="h-3 w-3 mr-1" /> Add step
          </Button>
        </div>

        <div className="space-y-2">
          {poster.steps.map((step, index) => (
            <div
              key={step.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(index)}
              className={cn(
                "flex items-center gap-2 rounded-xl border p-2 bg-card",
                dragIndex === index && "opacity-50"
              )}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />

              <button
                type="button"
                className="text-2xl shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center"
                onClick={() => setEditingIcon(editingIcon === step.id ? null : step.id)}
              >
                {step.iconEmoji}
              </button>

              <Input
                value={step.title}
                onChange={(e) => updateStep(index, { title: e.target.value })}
                className="rounded-lg flex-1"
              />

              <div className="flex shrink-0 gap-0.5">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveStep(index, -1)}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveStep(index, 1)}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => removeStep(index)}
                  disabled={poster.steps.length <= 2}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {editingIcon && (
          <div className="flex flex-wrap gap-2 p-3 rounded-xl border bg-muted/30">
            {STEP_ICON_OPTIONS.map((emoji) => {
              const idx = poster.steps.findIndex((s) => s.id === editingIcon);
              return (
                <button
                  key={emoji}
                  type="button"
                  className="text-2xl p-1 rounded-lg hover:bg-muted"
                  onClick={() => {
                    if (idx >= 0) updateStep(idx, { iconEmoji: emoji });
                    setEditingIcon(null);
                  }}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

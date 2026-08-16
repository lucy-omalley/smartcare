"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GripVertical, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { RoutinePosterView, PosterStepView } from "@/types/routine-poster";
import { STEP_ICON_OPTIONS } from "@/lib/posters/constants";
import { cn } from "@/lib/utils";

interface PosterEditorProps {
  poster: RoutinePosterView;
  onChange: (steps: PosterStepView[], meta?: Partial<RoutinePosterView>) => void;
}

export function PosterEditor({ poster, onChange }: PosterEditorProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [editingIcon, setEditingIcon] = useState<string | null>(null);

  const updateSteps = useCallback(
    (steps: PosterStepView[]) => onChange(steps),
    [onChange]
  );

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

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Poster title</Label>
        <Input
          value={poster.title}
          onChange={(e) => onChange(poster.steps, { title: e.target.value })}
          className="rounded-xl"
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

"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GripVertical, Plus, Trash2, ChevronUp, ChevronDown, Lock } from "lucide-react";
import type { AdventureJourneyView, AdventurePageView, AdventureFeatures } from "@/types/adventure-journey";
import { STEP_ICON_OPTIONS, POSTER_COLOUR_OPTIONS, FREE_POSTER_THEMES } from "@/lib/posters/constants";
import { POSTER_THEMES } from "@/lib/posters/themes";
import { ADVENTURE_FORMAT_OPTIONS, STORY_THEME_OPTIONS } from "@/lib/adventure/constants";
import type { AdventureFormat, PosterTheme, StoryTheme } from "@prisma/client";
import { cn } from "@/lib/utils";

interface AdventureEditorProps {
  adventure: AdventureJourneyView;
  features: AdventureFeatures;
  onChange: (pages: AdventurePageView[], meta?: Partial<AdventureJourneyView>) => void;
}

export function AdventureEditor({ adventure, features, onChange }: AdventureEditorProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [editingIcon, setEditingIcon] = useState<string | null>(null);
  const pages = adventure.pages.length ? adventure.pages : adventure.steps;

  const updatePages = useCallback(
    (next: AdventurePageView[]) => onChange(next),
    [onChange]
  );

  const isThemeLocked = (t: PosterTheme) =>
    !features.unlimitedThemes && !FREE_POSTER_THEMES.includes(t);

  const isFormatLocked = (format: AdventureFormat) => {
    const opt = ADVENTURE_FORMAT_OPTIONS.find((o) => o.value === format);
    return Boolean(opt?.premium && !features.isPremium);
  };

  const movePage = (index: number, direction: -1 | 1) => {
    const next = [...pages];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    updatePages(next.map((s, i) => ({ ...s, orderIndex: i })));
  };

  const removePage = (index: number) => {
    if (pages.length <= 2) return;
    updatePages(pages.filter((_, i) => i !== index).map((s, i) => ({ ...s, orderIndex: i })));
  };

  const addPage = () => {
    const newPage: AdventurePageView = {
      id: `temp-${Date.now()}`,
      orderIndex: pages.length,
      title: "New Mission",
      storyText: "Your hero needs to complete this mission!",
      missionLabel: "New Mission",
      iconEmoji: "⭐",
      illustrationKey: null,
      rewardStars: 1,
      pageQrTarget: null,
      isStoryTimeStep: false,
      isSongStep: false,
    };
    updatePages([...pages, newPage]);
  };

  const updatePage = (index: number, patch: Partial<AdventurePageView>) => {
    updatePages(pages.map((s, i) => (i === index ? { ...s, ...patch, title: patch.missionLabel ?? patch.title ?? s.title } : s)));
  };

  const onDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = [...pages];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    updatePages(next.map((s, i) => ({ ...s, orderIndex: i })));
    setDragIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Adventure title</Label>
        <Input
          value={adventure.title}
          onChange={(e) => onChange(pages, { title: e.target.value })}
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label>Hero character name</Label>
        <Input
          value={adventure.characterName ?? ""}
          onChange={(e) => onChange(pages, { characterName: e.target.value })}
          className="rounded-xl"
          placeholder="e.g. Captain Dino"
        />
      </div>

      <div className="space-y-2">
        <Label>Story introduction</Label>
        <Textarea
          value={adventure.storyIntro ?? ""}
          onChange={(e) => onChange(pages, { storyIntro: e.target.value })}
          className="rounded-xl min-h-[72px]"
          placeholder="Once upon a time..."
        />
      </div>

      <div className="space-y-2">
        <Label>Story ending</Label>
        <Textarea
          value={adventure.storyEnding ?? ""}
          onChange={(e) => onChange(pages, { storyEnding: e.target.value })}
          className="rounded-xl min-h-[72px]"
          placeholder="Congratulations! ..."
        />
      </div>

      <div className="space-y-2">
        <Label>Celebration message</Label>
        <Input
          value={adventure.celebrationText ?? ""}
          onChange={(e) => onChange(pages, { celebrationText: e.target.value })}
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label>Story style</Label>
        <div className="flex flex-wrap gap-2">
          {STORY_THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(pages, { storyTheme: opt.value as StoryTheme })}
              className={cn(
                "rounded-full px-3 py-1 text-xs border",
                adventure.storyTheme === opt.value ? "border-primary bg-primary/10" : "hover:bg-muted/50"
              )}
            >
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Visual theme</Label>
        <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto">
          {(Object.keys(POSTER_THEMES) as PosterTheme[]).map((key) => {
            const meta = POSTER_THEMES[key];
            const locked = isThemeLocked(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => !locked && onChange(pages, { theme: key })}
                className={cn(
                  "rounded-lg border p-1.5 text-center text-[10px] relative",
                  adventure.theme === key ? "border-primary bg-primary/10" : "hover:bg-muted/50",
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
        <Label>Print format</Label>
        <div className="grid grid-cols-1 gap-2">
          {ADVENTURE_FORMAT_OPTIONS.map((opt) => {
            const locked = isFormatLocked(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => !locked && onChange(pages, { adventureFormat: opt.value })}
                className={cn(
                  "rounded-xl border p-2 text-left text-xs relative",
                  adventure.adventureFormat === opt.value ? "border-primary bg-primary/10" : "hover:bg-muted/50",
                  locked && "opacity-60"
                )}
              >
                {locked && <Lock className="h-3 w-3 absolute top-2 right-2" />}
                {opt.label}
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
              onClick={() =>
                onChange(pages, {
                  favouriteColours: adventure.favouriteColours[0] === c.value ? [] : [c.value],
                })
              }
              className={cn(
                "rounded-full px-3 py-1 text-xs border",
                adventure.favouriteColours[0] === c.value && "ring-2 ring-primary"
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
          <Label>Missions — drag to reorder</Label>
          <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={addPage}>
            <Plus className="h-3 w-3 mr-1" /> Add mission
          </Button>
        </div>

        <div className="space-y-3">
          {pages.map((page, index) => (
            <div
              key={page.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(index)}
              className={cn(
                "rounded-xl border p-3 bg-card space-y-2",
                dragIndex === index && "opacity-50"
              )}
            >
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
                <button
                  type="button"
                  className="text-2xl shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center"
                  onClick={() => setEditingIcon(editingIcon === page.id ? null : page.id)}
                >
                  {page.iconEmoji}
                </button>
                <Input
                  value={page.missionLabel ?? page.title}
                  onChange={(e) =>
                    updatePage(index, { missionLabel: e.target.value, title: e.target.value })
                  }
                  className="rounded-lg flex-1"
                  placeholder="Mission name"
                />
                <div className="flex shrink-0 gap-0.5">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => movePage(index, -1)}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => movePage(index, 1)}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removePage(index)}
                    disabled={pages.length <= 2}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Textarea
                value={page.storyText ?? ""}
                onChange={(e) => updatePage(index, { storyText: e.target.value })}
                className="rounded-lg text-sm min-h-[60px]"
                placeholder="Story moment for this page..."
              />
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => updatePage(index, { isStoryTimeStep: !page.isStoryTimeStep, isSongStep: false })}
                  className={cn(
                    "rounded-full px-2 py-1 text-[10px] border",
                    page.isStoryTimeStep && "border-primary bg-primary/10"
                  )}
                >
                  📖 Story QR
                </button>
                <button
                  type="button"
                  onClick={() => updatePage(index, { isSongStep: !page.isSongStep, isStoryTimeStep: false })}
                  className={cn(
                    "rounded-full px-2 py-1 text-[10px] border",
                    page.isSongStep && "border-primary bg-primary/10"
                  )}
                >
                  🎵 Song QR
                </button>
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => updatePage(index, { rewardStars: n })}
                    className={cn(
                      "rounded-full px-2 py-1 text-[10px] border",
                      page.rewardStars === n && "border-primary bg-primary/10"
                    )}
                  >
                    {"⭐".repeat(n)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {editingIcon && (
          <div className="flex flex-wrap gap-2 p-3 rounded-xl border bg-muted/30">
            {STEP_ICON_OPTIONS.map((emoji) => {
              const idx = pages.findIndex((s) => s.id === editingIcon);
              return (
                <button
                  key={emoji}
                  type="button"
                  className="text-2xl p-1 rounded-lg hover:bg-muted"
                  onClick={() => {
                    if (idx >= 0) updatePage(idx, { iconEmoji: emoji });
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

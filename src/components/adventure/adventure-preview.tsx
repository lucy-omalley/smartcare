"use client";

import type { AdventureJourneyView } from "@/types/adventure-journey";
import { AdventureStoryBook } from "@/components/adventure/adventure-story-book";
import { PosterFlowChart } from "@/components/posters/poster-flow-chart";
import { applyColourAccent, getThemeStyle } from "@/lib/posters/themes";
import { cn } from "@/lib/utils";

interface AdventurePreviewProps {
  adventure: AdventureJourneyView;
  printMode?: boolean;
}

function ComicStripPreview({ adventure, printMode }: AdventurePreviewProps) {
  const theme = applyColourAccent(getThemeStyle(adventure.theme), adventure.favouriteColours[0]);
  const pages = adventure.pages.length ? adventure.pages : adventure.steps;

  return (
    <div id="adventure-print-root" className="space-y-4 print:space-y-0">
      <div
        className={cn(
          "rounded-2xl p-4 print:break-after-page",
          printMode && "rounded-none"
        )}
        style={{ background: theme.backgroundGradient, color: theme.text }}
      >
        <h2 className={cn(theme.fontClass, "text-xl text-center mb-4")} style={{ color: theme.primary }}>
          {adventure.title}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {pages.map((page, i) => (
            <div
              key={page.id}
              className="rounded-xl border-2 bg-white/70 p-3 space-y-2"
              style={{ borderColor: theme.secondary }}
            >
              <p className="text-[10px] font-bold opacity-60">Panel {i + 1}</p>
              <p className="text-4xl text-center">{page.iconEmoji}</p>
              {page.storyText && <p className="text-xs leading-snug">{page.storyText}</p>}
              <p className={cn(theme.fontClass, "text-sm font-bold text-center")}>
                {page.missionLabel ?? page.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdventureCardsPreview({ adventure, printMode }: AdventurePreviewProps) {
  const theme = applyColourAccent(getThemeStyle(adventure.theme), adventure.favouriteColours[0]);
  const pages = adventure.pages.length ? adventure.pages : adventure.steps;

  return (
    <div id="adventure-print-root" className="print:break-inside-avoid">
      <div
        className={cn("rounded-2xl p-4", printMode && "rounded-none")}
        style={{ background: theme.backgroundGradient }}
      >
        <h2 className={cn(theme.fontClass, "text-lg text-center mb-4")} style={{ color: theme.primary }}>
          {adventure.title} — Mission Cards
        </h2>
        <div className="grid grid-cols-2 gap-3 print:grid-cols-2">
          {pages.map((page) => (
            <div
              key={page.id}
              className="rounded-xl border-2 border-dashed bg-white p-4 text-center space-y-2 print:break-inside-avoid"
              style={{ borderColor: theme.accent }}
            >
              <p className="text-5xl">{page.iconEmoji}</p>
              <p className={cn(theme.fontClass, "font-bold text-sm")}>{page.missionLabel ?? page.title}</p>
              {page.storyText && <p className="text-[10px] leading-snug opacity-80">{page.storyText}</p>}
              <p className="text-lg">{"⭐".repeat(page.rewardStars ?? 1)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Renders the adventure in the selected format */
export function AdventurePreview({ adventure, printMode }: AdventurePreviewProps) {
  const format = adventure.adventureFormat ?? "STORY_BOOK";

  switch (format) {
    case "FLOW_CHART":
    case "POSTER":
      return (
        <div id="adventure-print-root">
          <PosterFlowChart
            poster={adventure}
            printMode={printMode}
            scanBasePath="/adventure-journey/scan"
          />
        </div>
      );
    case "COMIC_STRIP":
      return <ComicStripPreview adventure={adventure} printMode={printMode} />;
    case "ADVENTURE_CARDS":
      return <AdventureCardsPreview adventure={adventure} printMode={printMode} />;
    case "STORY_BOOK":
    default:
      return <AdventureStoryBook adventure={adventure} printMode={printMode} />;
  }
}

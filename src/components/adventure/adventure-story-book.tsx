"use client";

import { useEffect, useRef, useState } from "react";
import type { AdventureJourneyView } from "@/types/adventure-journey";
import { applyColourAccent, getThemeStyle } from "@/lib/posters/themes";
import { missionIllustrationEmoji } from "@/lib/adventure/constants";
import { cn } from "@/lib/utils";

interface AdventureStoryBookProps {
  adventure: AdventureJourneyView;
  className?: string;
  printMode?: boolean;
  scanBasePath?: string;
}

function MissionIllustration({ emoji, size = "large" }: { emoji: string; size?: "large" | "medium" }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-3xl bg-white/80 border-2 border-white/90 shadow-inner",
        size === "large" ? "w-40 h-40 text-7xl" : "w-28 h-28 text-5xl"
      )}
      role="img"
      aria-hidden
    >
      {emoji}
    </div>
  );
}

function PageQr({
  adventureId,
  target,
  scanBasePath = "/adventure-journey/scan",
  label,
}: {
  adventureId: string;
  target: "story" | "song" | "plan";
  scanBasePath?: string;
  label: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const QRCode = (await import("qrcode")).default;
      const url = `${window.location.origin}${scanBasePath}/${adventureId}?target=${target}`;
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;
      await QRCode.toCanvas(canvas, url, { width: 72, margin: 1 });
    })();
    return () => {
      cancelled = true;
    };
  }, [adventureId, target, scanBasePath]);

  return (
    <div className="flex items-center gap-2">
      <canvas ref={canvasRef} className="rounded-lg bg-white p-1 shrink-0" aria-label={`QR: ${label}`} />
      <div className="text-left text-xs">
        <p className="font-semibold">{label}</p>
        <p className="opacity-70">Scan in Parenfy</p>
      </div>
    </div>
  );
}

function StoryPage({
  adventure,
  theme,
  printMode,
  scanBasePath,
  children,
  className,
}: {
  adventure: AdventureJourneyView;
  theme: ReturnType<typeof applyColourAccent>;
  printMode?: boolean;
  scanBasePath?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative rounded-3xl shadow-lg overflow-hidden",
        "print:shadow-none print:rounded-none print:break-after-page print:min-h-[260mm]",
        printMode && "shadow-none rounded-none",
        className
      )}
      style={{
        background: theme.backgroundGradient,
        color: theme.text,
        maxWidth: printMode ? "100%" : 420,
        width: "100%",
      }}
    >
      <div className={cn("flex flex-col p-6 md:p-8 gap-4", "print:p-10")}>{children}</div>
    </div>
  );
}

export function AdventureStoryBook({
  adventure,
  className,
  printMode,
  scanBasePath = "/adventure-journey/scan",
}: AdventureStoryBookProps) {
  const theme = applyColourAccent(getThemeStyle(adventure.theme), adventure.favouriteColours[0]);
  const pages = adventure.pages.length ? adventure.pages : adventure.steps;
  const hero = adventure.characterName ?? adventure.childName ?? "Hero";

  return (
    <div className={cn("flex flex-col gap-6 print:gap-0", className)} id="adventure-print-root">
      {/* Cover / intro */}
      <StoryPage adventure={adventure} theme={theme} printMode={printMode} scanBasePath={scanBasePath}>
        <header className="text-center space-y-3">
          <p className="text-5xl">{theme.emoji}</p>
          <h2 className={cn(theme.fontClass, "text-2xl md:text-3xl")} style={{ color: theme.primary }}>
            {adventure.title}
          </h2>
          {adventure.storyIntro && (
            <p className="text-base leading-relaxed opacity-90 max-w-sm mx-auto">{adventure.storyIntro}</p>
          )}
          <p className="text-sm font-medium" style={{ color: theme.secondary }}>
            Starring {hero}
          </p>
        </header>
        <div className="flex justify-center pt-2">
          <MissionIllustration emoji={theme.emoji} />
        </div>
        <p className="text-center text-sm opacity-75">Turn the page — your adventure begins!</p>
      </StoryPage>

      {/* Mission pages */}
      {pages.map((page, index) => {
        const illustration = missionIllustrationEmoji(
          page.missionLabel ?? page.title,
          page.iconEmoji
        );
        const stars = "⭐".repeat(Math.min(page.rewardStars ?? 1, 3));

        return (
          <StoryPage
            key={page.id}
            adventure={adventure}
            theme={theme}
            printMode={printMode}
            scanBasePath={scanBasePath}
          >
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
              Page {index + 1}
            </p>
            {page.storyText && (
              <p className={cn(theme.fontClass, "text-lg leading-snug")} style={{ color: theme.primary }}>
                {page.storyText}
              </p>
            )}
            <div className="flex justify-center py-2">
              <MissionIllustration emoji={illustration} />
            </div>
            <div
              className="rounded-2xl py-4 px-6 text-center border-2 bg-white/75"
              style={{ borderColor: theme.accent }}
            >
              <p className="text-xs uppercase tracking-wide opacity-70 mb-1">Mission</p>
              <p className={cn(theme.fontClass, "text-xl font-bold flex items-center justify-center gap-2")}>
                <span className="text-3xl">{page.iconEmoji}</span>
                {page.missionLabel ?? page.title}
              </p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold" style={{ color: theme.primary }}>
                Reward
              </p>
              <p className="text-2xl">{stars || "⭐"}</p>
              <p className="text-xs opacity-75">Mission complete!</p>
            </div>
            {(page.isStoryTimeStep || page.isSongStep) && (
              <div className="mt-2 pt-3 border-t border-white/40 flex justify-center">
                <PageQr
                  adventureId={adventure.id}
                  target={page.isSongStep ? "song" : "story"}
                  scanBasePath={scanBasePath}
                  label={page.isSongStep ? "Family Voice Song" : "Family Voice Story"}
                />
              </div>
            )}
          </StoryPage>
        );
      })}

      {/* Celebration ending */}
      <StoryPage adventure={adventure} theme={theme} printMode={printMode} scanBasePath={scanBasePath}>
        <div className="text-center space-y-4 py-4">
          <p className="text-6xl">{theme.rewardEmoji}</p>
          <h3 className={cn(theme.fontClass, "text-2xl")} style={{ color: theme.primary }}>
            Congratulations!
          </h3>
          {adventure.storyEnding && (
            <p className="text-lg leading-relaxed">{adventure.storyEnding}</p>
          )}
          {adventure.celebrationText && (
            <p
              className="rounded-xl py-3 px-4 text-base font-semibold inline-block"
              style={{ backgroundColor: `${theme.accent}44`, color: theme.primary }}
            >
              {adventure.celebrationText}
            </p>
          )}
          <div className="pt-2 space-y-1">
            <p className="text-sm font-semibold">Adventure points earned</p>
            <p className="text-3xl">{adventure.adventurePoints} 🏆</p>
            <p className="text-xs opacity-75">
              {adventure.totalRewardStars} stars collected today
            </p>
          </div>
        </div>
        <div className="flex justify-center pt-2">
          <PageQr
            adventureId={adventure.id}
            target="plan"
            scanBasePath={scanBasePath}
            label="Today's Adventure"
          />
        </div>
      </StoryPage>
    </div>
  );
}

export function AdventurePreviewWithQr({
  adventure,
  printMode,
}: {
  adventure: AdventureJourneyView;
  printMode?: boolean;
}) {
  return <AdventureStoryBook adventure={adventure} printMode={printMode} />;
}

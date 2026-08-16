"use client";

import { useEffect, useRef, useState } from "react";
import type { RoutinePosterView } from "@/types/routine-poster";
import { applyColourAccent, getThemeStyle } from "@/lib/posters/themes";
import { POSTER_LAYOUT_META } from "@/lib/posters/constants";
import { cn } from "@/lib/utils";

interface PosterFlowChartProps {
  poster: RoutinePosterView;
  className?: string;
  printMode?: boolean;
  qrDataUrl?: string | null;
}

export function PosterFlowChart({ poster, className, printMode, qrDataUrl }: PosterFlowChartProps) {
  const theme = applyColourAccent(getThemeStyle(poster.theme), poster.favouriteColours[0]);
  const layout = POSTER_LAYOUT_META[poster.layout];
  const isCompact = layout.widthMm < 160;
  const stepCount = poster.steps.length;
  const isDense = stepCount > 6;

  return (
    <div
      className={cn(
        "relative rounded-2xl shadow-lg",
        "print:shadow-none print:rounded-none print:max-w-none print:w-full print:h-auto print:overflow-visible",
        printMode && "shadow-none rounded-none",
        className
      )}
      style={{
        background: theme.backgroundGradient,
        color: theme.text,
        maxWidth: printMode ? "100%" : isCompact ? 320 : 480,
        width: "100%",
      }}
    >
      <div
        className={cn(
          "flex flex-col",
          isCompact ? "p-4" : "p-6 md:p-8",
          isDense && !isCompact && "p-5 md:p-6",
          "print:p-6"
        )}
      >
        <header className={cn("text-center space-y-1", isDense ? "mb-2" : "mb-4")}>
          <p className={cn(isDense ? "text-2xl" : "text-3xl")}>{theme.emoji}</p>
          <h2
            className={cn(
              theme.fontClass,
              isCompact ? "text-lg" : isDense ? "text-xl" : "text-2xl"
            )}
            style={{ color: theme.primary }}
          >
            {poster.title}
          </h2>
          {poster.childName && (
            <p className="text-sm opacity-80">For {poster.childName}</p>
          )}
          {poster.routineGoal && (
            <p className={cn("text-xs opacity-75 max-w-sm mx-auto leading-snug", isCompact ? "px-2" : "px-4")}>
              {poster.routineGoal}
            </p>
          )}
        </header>

        <div className="flex flex-col items-center gap-1 w-full print:overflow-visible">
          {poster.steps.map((step, i) => (
            <div key={step.id} className="flex flex-col items-center w-full">
              <div
                className={cn(
                  "flex items-center gap-3 w-full rounded-2xl border-2 bg-white/70 backdrop-blur-sm",
                  isCompact || isDense ? "px-3 py-2" : "px-4 py-3"
                )}
                style={{ borderColor: theme.secondary }}
              >
                <span
                  className={cn(
                    isCompact ? "text-3xl" : isDense ? "text-4xl" : "text-5xl"
                  )}
                  role="img"
                  aria-hidden
                >
                  {step.iconEmoji}
                </span>
                <p
                  className={cn(
                    theme.fontClass,
                    "flex-1 text-left",
                    isCompact || isDense ? "text-sm" : "text-lg"
                  )}
                  style={{ color: theme.text }}
                >
                  {step.title}
                </p>
              </div>
              {i < poster.steps.length - 1 && (
                <span
                  className={cn("my-0.5", isCompact || isDense ? "text-lg" : "text-2xl")}
                  style={{ color: theme.arrowColor }}
                  aria-hidden
                >
                  ↓
                </span>
              )}
            </div>
          ))}
        </div>

        {poster.celebrationText && (
          <div
            className={cn(
              "text-center mt-3 rounded-xl py-2 px-3",
              isCompact ? "text-sm" : "text-base"
            )}
            style={{ backgroundColor: `${theme.accent}33`, color: theme.primary }}
          >
            {theme.rewardEmoji} {poster.celebrationText}
          </div>
        )}

        {poster.rewardEnabled && (
          <div className={cn("mt-3 text-center", isCompact ? "text-xs" : "text-sm")}>
            <p className="font-semibold mb-1" style={{ color: theme.primary }}>
              Daily Reward
            </p>
            <div className="flex justify-center gap-2 text-xl">
              {"⭐".repeat(3)}
              <span className="mx-1">·</span>
              <span>🏆 Weekly Badge</span>
            </div>
          </div>
        )}

        <footer className="mt-4 flex items-end justify-between gap-3">
          <div className="flex items-center gap-2">
            {qrDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="Scan for today's plan" className="w-14 h-14 rounded-lg bg-white p-1" />
            )}
            <div className={cn("text-left", isCompact ? "text-[10px]" : "text-xs")}>
              <p className="font-medium">Scan in Parenfy</p>
              <p className="opacity-70">Today&apos;s plan &amp; story</p>
              {poster.parentSignature && (
                <p className="mt-1 italic">— {poster.parentSignature}</p>
              )}
            </div>
          </div>
          {poster.stickerSpaceEnabled && (
            <div
              className={cn(
                "border-2 border-dashed rounded-xl flex items-center justify-center shrink-0",
                isCompact ? "w-12 h-12 text-[9px]" : "w-16 h-16 text-xs"
              )}
              style={{ borderColor: theme.accent, color: theme.text }}
            >
              Stickers
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}

interface PosterQrProps {
  posterId: string;
  size?: number;
}

export function PosterQr({ posterId, size = 120 }: PosterQrProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const QRCode = (await import("qrcode")).default;
      const base = window.location.origin;
      const url = `${base}/routine-designer/scan/${posterId}`;
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;
      await QRCode.toCanvas(canvas, url, { width: size, margin: 1 });
    })();
    return () => {
      cancelled = true;
    };
  }, [posterId, size]);

  return <canvas ref={canvasRef} className="rounded-lg bg-white p-1" aria-label="QR code" />;
}

export function PosterPreviewWithQr({ poster, printMode }: { poster: RoutinePosterView; printMode?: boolean }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const QRCode = (await import("qrcode")).default;
      const url = `${window.location.origin}/routine-designer/scan/${poster.id}`;
      const dataUrl = await QRCode.toDataURL(url, { width: 120, margin: 1 });
      if (!cancelled) setQrDataUrl(dataUrl);
    })();
    return () => {
      cancelled = true;
    };
  }, [poster.id]);

  return (
    <div id="poster-print-root">
      <PosterFlowChart poster={poster} printMode={printMode} qrDataUrl={qrDataUrl} />
    </div>
  );
}

import "server-only";

import type { PosterQrTarget } from "@prisma/client";

export function getPosterScanUrl(posterId: string, baseUrl?: string): string {
  const base =
    baseUrl?.replace(/\/$/, "") ??
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return `${base}/adventure-journey/scan/${posterId}`;
}

export function getQrRedirectPath(qrTarget: PosterQrTarget, posterId: string): string {
  switch (qrTarget) {
    case "TODAY_STORY":
      return "/stories";
    case "TODAY_SONG":
      return "/stories";
    case "ROUTINE_PLAYER":
      return `/routines/${posterId}`;
    case "TODAY_PLAN":
    default:
      return "/today";
  }
}

export function inferQrTargetFromSteps(steps: Array<{ isStoryTimeStep: boolean; isSongStep: boolean }>): PosterQrTarget {
  if (steps.some((s) => s.isStoryTimeStep)) return "TODAY_STORY";
  if (steps.some((s) => s.isSongStep)) return "TODAY_SONG";
  return "TODAY_PLAN";
}

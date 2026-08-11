"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getAnalyticsSessionId, getStoredReferralSource } from "@/lib/analytics/referral-capture";

function pingSession(action: "start" | "heartbeat" | "end", path?: string) {
  const sessionId = getAnalyticsSessionId();
  if (!sessionId) return;
  const body = JSON.stringify({
    sessionId,
    action,
    path,
    referrerSource: getStoredReferralSource(),
  });
  try {
    if (action === "end" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics/session", new Blob([body], { type: "application/json" }));
      return;
    }
  } catch {
    /* fall through */
  }
  void fetch("/api/analytics/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: action === "end",
  }).catch(() => {});
}

/** Tracks product sessions for founder analytics (duration, pages, bounce). */
export function AnalyticsSessionTracker() {
  const pathname = usePathname();

  useEffect(() => {
    pingSession("start", pathname);
    const interval = setInterval(() => pingSession("heartbeat", pathname), 60_000);
    return () => {
      clearInterval(interval);
      pingSession("end", pathname);
    };
  }, [pathname]);

  return null;
}

"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { initPostHogClient, getPostHogClient } from "@/lib/analytics/posthog-client";
import { identifyUser, resetAnalyticsIdentity, trackFeatureUsed, trackEvent } from "@/lib/analytics/track";
import { PATH_FEATURE_MAP } from "@/lib/analytics/events";

type ProfileTraits = {
  email?: string | null;
  createdAt?: string;
  childAge?: string | null;
};

/** Initialise PostHog, identify users, and track feature usage by route. */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);
  const identified = useRef<string | null>(null);

  useEffect(() => {
    initPostHogClient();
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) {
      if (status === "unauthenticated" && identified.current) {
        resetAnalyticsIdentity();
        identified.current = null;
      }
      return;
    }

    if (identified.current === session.user.id) return;

    void fetch("/api/analytics/traits")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { traits?: ProfileTraits } | null) => {
        const traits = data?.traits;
        identifyUser(session.user!.id!, {
          email: session.user?.email,
          signup_date: traits?.createdAt,
          child_age: traits?.childAge ?? undefined,
          subscription_type: "free",
        });
        identified.current = session.user!.id!;
      })
      .catch(() => {
        identifyUser(session.user!.id!, {
          email: session.user?.email,
          subscription_type: "free",
        });
        identified.current = session.user!.id!;
      });
  }, [status, session?.user?.id, session?.user?.email]);

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    lastPath.current = pathname;

    getPostHogClient()?.capture("$pageview", { $current_url: pathname });

    const base = pathname.split("?")[0];
    const feature = PATH_FEATURE_MAP[base];
    if (feature) {
      trackFeatureUsed(feature, base);
    }

    if (base === "/mumbot") {
      trackEvent("mumbot_opened");
    }
    if (base === "/connect") {
      trackEvent("connect_page_opened");
    }
  }, [pathname]);

  return <>{children}</>;
}

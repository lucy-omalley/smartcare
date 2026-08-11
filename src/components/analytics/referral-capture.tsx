"use client";

import { useEffect } from "react";
import { captureReferralFromUrl } from "@/lib/analytics/referral-capture";

/** Persists ?source= / utm_source from any landing URL for signup attribution. */
export function ReferralCapture() {
  useEffect(() => {
    captureReferralFromUrl();
  }, []);
  return null;
}

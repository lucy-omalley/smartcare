/**
 * Analytics event tracking placeholders for Parenfy beta.
 * TODO: Wire to PostHog, Google Analytics, or Supabase events in Vercel production.
 */

export type AnalyticsEvent =
  | "signup_completed"
  | "child_profile_created"
  | "parenting_goals_selected"
  | "current_challenges_selected"
  | "today_dashboard_viewed"
  | "mumbot_question"
  | "meal_clicked"
  | "meal_from_fridge"
  | "meal_from_fridge_retry"
  | "story_clicked"
  | "activity_clicked"
  | "connect_status_created"
  | "event_created"
  | "event_joined"
  | "parent_checkin_completed"
  | "feedback_submitted"
  | "day2_return"
  | "day7_return";

export function trackEvent(event: AnalyticsEvent, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  // TODO: Replace with PostHog / Google Analytics / Supabase events
  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", event, properties);
  }
}

const RETURN_KEY = "parenfy_first_visit";

/** Track day-2 and day-7 return on Today dashboard load. */
export function trackReturnVisit(): void {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(RETURN_KEY);
  const now = Date.now();
  if (!raw) {
    localStorage.setItem(RETURN_KEY, String(now));
    return;
  }
  const firstVisit = parseInt(raw, 10);
  if (Number.isNaN(firstVisit)) return;
  const days = Math.floor((now - firstVisit) / (1000 * 60 * 60 * 24));
  const day2Key = "parenfy_day2_tracked";
  const day7Key = "parenfy_day7_tracked";
  if (days >= 1 && days < 7 && !localStorage.getItem(day2Key)) {
    trackEvent("day2_return");
    localStorage.setItem(day2Key, "1");
  }
  if (days >= 7 && !localStorage.getItem(day7Key)) {
    trackEvent("day7_return");
    localStorage.setItem(day7Key, "1");
  }
}

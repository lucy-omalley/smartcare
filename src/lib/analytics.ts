/**
 * Analytics event tracking placeholders for Parenfy beta.
 * TODO: Wire to PostHog, Google Analytics, or Supabase events in Vercel production.
 */

export type AnalyticsEvent =
  | "signup_completed"
  | "child_profile_created"
  | "parenting_goals_selected"
  | "current_challenges_selected"
  | "daily_plan_viewed"
  | "mumbot_question_asked"
  | "available_status_created"
  | "connection_interest_sent"
  | "connection_request_accepted"
  | "event_created"
  | "event_join_requested"
  | "event_joined"
  | "parent_checkin_completed"
  | "recipe_clicked"
  | "story_clicked"
  | "return_day_2"
  | "return_day_7";

export function trackEvent(event: AnalyticsEvent, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  // TODO: Replace with PostHog / Google Analytics / Supabase events
  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", event, properties);
  }
}

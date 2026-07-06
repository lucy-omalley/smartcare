/** PostHog product analytics event names — keep in sync with founder dashboard queries. */
export type AnalyticsEvent =
  // Landing & beta
  | "landing_page_viewed"
  | "beta_cta_clicked"
  // Authentication
  | "signup_started"
  | "signup_completed"
  | "login"
  | "login_completed"
  | "logout"
  | "account_deleted"
  // Onboarding
  | "onboarding_started"
  | "child_profile_created"
  | "child_profile_updated"
  | "parenting_goals_selected"
  | "current_challenges_selected"
  | "connect_area_selected"
  | "onboarding_completed"
  | "onboarding_skipped"
  // Today dashboard
  | "today_dashboard_viewed"
  | "meal_card_opened"
  | "meal_opened"
  | "story_card_opened"
  | "story_opened"
  | "activity_card_opened"
  | "activity_opened"
  | "language_card_opened"
  | "milestone_card_opened"
  | "parent_tip_opened"
  | "today_plan_viewed"
  | "today_refresh_clicked"
  // MumBot
  | "mumbot_opened"
  | "mumbot_question_asked"
  | "mumbot_followup_clicked"
  | "mumbot_story_generated"
  | "mumbot_recipe_generated"
  | "mumbot_activity_generated"
  | "mumbot_feedback_positive"
  | "mumbot_feedback_negative"
  // Stories
  | "story_started"
  | "story_completed"
  | "story_saved"
  | "story_rotated"
  // Meals
  | "meal_viewed"
  | "meal_saved"
  | "meal_rotated"
  | "meal_from_fridge"
  | "meal_from_fridge_retry"
  // Activities
  | "activity_started"
  | "activity_completed"
  | "activity_rotated"
  // Language
  | "language_activity_started"
  | "language_activity_completed"
  // Connect
  | "available_today_created"
  | "available_today_updated"
  | "available_today_closed"
  | "event_created"
  | "event_updated"
  | "event_join_requested"
  | "event_join_approved"
  | "event_join_declined"
  | "connection_interest_sent"
  | "connection_request_accepted"
  | "connection_request_declined"
  | "connect_page_opened"
  | "connect_opened"
  // Parent check-in
  | "parent_checkin_started"
  | "parent_checkin_completed"
  // Retention
  | "day_1_return"
  | "day_3_return"
  | "day_7_return"
  | "day_30_return"
  | "weekly_active_user"
  | "monthly_active_user"
  // Feature usage (page / section)
  | "feature_used"
  // Feedback & errors
  | "feedback_submitted"
  | "error_occurred"
  | "app_error";

export type FeatureName =
  | "Today"
  | "MumBot"
  | "Connect"
  | "Stories"
  | "Meals"
  | "Activities"
  | "Language"
  | "Milestones"
  | "Parent Check-in"
  | "Profile"
  | "Settings"
  | "Saved"
  | "More";

export const PATH_FEATURE_MAP: Record<string, FeatureName> = {
  "/today": "Today",
  "/mumbot": "MumBot",
  "/connect": "Connect",
  "/saved": "Saved",
  "/profile": "Profile",
  "/more": "More",
  "/onboarding": "Settings",
  "/home": "Today",
  "/memory": "Milestones",
  "/activities": "Activities",
  "/chat": "MumBot",
};

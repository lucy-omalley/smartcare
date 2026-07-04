/**
 * Product analytics — PostHog + internal persistence for founder insights.
 * Configure NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST in Vercel.
 */
export type { AnalyticsEvent, FeatureName } from "@/lib/analytics/events";
export { trackEvent, identifyUser, resetAnalyticsIdentity, trackFeatureUsed, trackClientError } from "@/lib/analytics/track";
export { trackReturnVisit } from "@/lib/analytics/retention";

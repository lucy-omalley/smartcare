/** Marketing image paths under /public/landing — replace files to update creative. */
export const LANDING_MARKETING = {
  hero: "/landing/marketing-hero.webp",
  toyBrain: "/landing/marketing-toy-brain.webp",
  adventure: "/landing/marketing-adventure.webp",
  story: "/landing/marketing-story.webp",
} as const;

export type MarketingImageKey = keyof typeof LANDING_MARKETING;

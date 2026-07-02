export const MEMORY_CATEGORIES = {
  MILESTONE: "Milestone",
  ROUTINE: "Routine",
  PREFERENCE: "Preference",
  LEARNING: "Learning",
  BEHAVIOUR: "Behaviour",
  FUNNY_MOMENT: "Funny Moment",
  CONCERN: "Concern",
  FAVOURITE_THINGS: "Favourite Things",
  JOURNAL: "Journal",
} as const;

export const PARENTING_GOALS = [
  "Better bedtime",
  "Speech development",
  "Emotional regulation",
  "Healthy eating",
  "Potty training",
  "Building confidence",
  "Sibling harmony",
  "Other",
];

export const PARENT_INTERESTS = [
  "Playdates",
  "Coffee walks",
  "Outdoor activities",
  "Speech & language",
  "Sleep routines",
  "Healthy eating",
  "New parent support",
  "Working parents",
  "Twins & multiples",
  "Special needs support",
] as const;

export const CHILD_AGE_BANDS = [
  "0-1 years",
  "1-2 years",
  "2-3 years",
  "3-4 years",
  "4-5 years",
  "5+ years",
] as const;

export const POST_TYPES = {
  QUESTION: "Questions",
  RECOMMENDATION: "Recommendations",
  STORY: "Parent Stories",
} as const;

export const EXCHANGE_CATEGORIES = {
  BOOKS: "Books",
  TOYS: "Toys",
  CLOTHES: "Clothes",
  BABY_EQUIPMENT: "Baby Equipment",
} as const;

export const ACTIVITY_CATEGORIES = {
  LIBRARY: "Library Events",
  MUSEUM: "Museum Activities",
  COMMUNITY_CENTRE: "Community Centre",
  PLAYGROUP: "Playgroups",
  FESTIVAL: "Family Festivals",
  OTHER: "Other",
} as const;

export function weatherIconUrl(icon: string): string {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

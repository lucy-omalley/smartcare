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

/** @deprecated Use PARENTING_GOAL_CATEGORIES for multi-select */
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

export const PARENTING_GOAL_CATEGORIES = [
  {
    emoji: "🌙",
    title: "Sleep & Routine",
    goals: [
      "Better bedtime",
      "Better naps",
      "Morning routine",
      "Daily routine",
      "Independent sleeping",
    ],
  },
  {
    emoji: "😊",
    title: "Behaviour & Emotions",
    goals: [
      "Tantrums",
      "Hitting / biting",
      "Emotional regulation",
      "Listening",
      "Confidence",
      "Sharing",
      "Social skills",
    ],
  },
  {
    emoji: "🍎",
    title: "Eating & Nutrition",
    goals: [
      "Picky eating",
      "Healthy recipes",
      "Lunchbox ideas",
      "New foods",
      "Meal planning",
    ],
  },
  {
    emoji: "📚",
    title: "Learning & Development",
    goals: [
      "Speech & language",
      "Reading",
      "Creativity",
      "Early learning",
      "Motor skills",
      "Milestones",
    ],
  },
  {
    emoji: "🎲",
    title: "Play & Activities",
    goals: [
      "Indoor activities",
      "Outdoor play",
      "Weekend ideas",
      "Rainy day ideas",
      "Screen-free play",
    ],
  },
  {
    emoji: "❤️",
    title: "Parent Wellbeing",
    goals: [
      "Reduce stress",
      "Parenting confidence",
      "Mindfulness",
      "Work-life balance",
      "Parent check-ins",
    ],
  },
  {
    emoji: "👥",
    title: "Community",
    goals: [
      "Meet nearby parents",
      "Coffee walks",
      "Playdates",
      "Local family events",
      "Parent support",
    ],
  },
  {
    emoji: "🤖",
    title: "AI Support",
    goals: [
      "Daily parenting plan",
      "MumBot advice",
      "Bedtime stories",
      "Gentle reminders",
    ],
  },
] as const;

export const ALL_PARENTING_GOALS = PARENTING_GOAL_CATEGORIES.flatMap((c) => c.goals);

export const MAX_PARENTING_GOALS = 5;

export const CURRENT_CHALLENGES = [
  "Sleep",
  "Tantrums",
  "Picky eating",
  "Activities",
  "Speech",
  "Behaviour",
  "Toilet training",
  "Meeting other parents",
  "Feeling overwhelmed",
  "Development concerns",
  "Not sure",
] as const;

export const MAX_CURRENT_CHALLENGES = 2;

export const TIME_WINDOWS = ["Morning", "Afternoon", "Evening", "Flexible"] as const;

export const CONNECT_INTERESTS = [
  "Park",
  "Coffee",
  "Library",
  "Indoor Play",
  "Playground",
  "Walk",
  "Parent Chat",
] as const;

export const CONNECT_AGE_RANGES = ["Baby", "Toddler", "Preschool", "Primary school"] as const;

export const EVENT_ACTIVITY_TYPES = [
  "Park walk",
  "Library story time",
  "Coffee meetup",
  "Playground meetup",
  "Parent coffee morning",
  "Beach walk",
  "Indoor play",
  "Other",
] as const;

export const EVENT_VISIBILITY = ["public", "private"] as const;

export const EVENT_JOIN_APPROVAL = ["auto", "request"] as const;

export const EVENT_STATUSES = ["draft", "published", "full", "cancelled", "completed"] as const;

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

export const PRIVACY_COPY = {
  broadAvailability: "Parenfy only shares broad availability.",
  exactMeetup: "Exact meetup details are only shared if you choose.",
  noHomeAddress: "Block · Report · Moderation · Verified Parent (coming soon)",
} as const;

export function weatherIconUrl(icon: string): string {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

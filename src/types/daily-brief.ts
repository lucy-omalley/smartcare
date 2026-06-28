export interface DailyBriefRecipe {
  title: string;
  subtitle: string;
  prepTimeMinutes: number;
  whyThisMeal: string;
  ingredients: string[];
  steps: string[];
}

export interface DailyBriefPlay {
  title: string;
  materials: string[];
  instructions: string[];
  skillsDeveloped: string[];
  durationMinutes: number;
  indoorOutdoor: "indoor" | "outdoor" | "either";
}

export interface DailyBriefDevelopment {
  domain: string;
  insight: string;
  tryToday: string;
}

export interface DailyBriefTip {
  topic: string;
  content: string;
}

export interface DailyBriefStory {
  title: string;
  story: string;
  lengthMinutes: number;
  moral?: string;
}

export interface DailyBriefContent {
  greeting: string;
  childAgeDisplay: string;
  recipe: DailyBriefRecipe;
  play: DailyBriefPlay;
  development: DailyBriefDevelopment[];
  tip: DailyBriefTip;
  encouragement: string;
  bedtimeStory: DailyBriefStory;
}

export interface LibraryRecommendation {
  title: string;
  summary: string;
  relevance: string;
}

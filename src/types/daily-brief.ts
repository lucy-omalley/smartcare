export interface RecipeSampleLink {
  title: string;
  url: string;
  type: "youtube" | "article";
}

export interface DailyBriefRecipe {
  title: string;
  subtitle: string;
  prepTimeMinutes: number;
  whyThisMeal: string;
  ingredients: string[];
  steps: string[];
  imageData?: string;
  difficulty?: "Easy" | "Medium";
  nutritionalHighlights?: string[];
  healthyTip?: string;
  healthyAlternative?: string;
  sampleLinks?: RecipeSampleLink[];
  fromFridge?: boolean;
}

export interface DailyBriefPlay {
  title: string;
  materials: string[];
  instructions: string[];
  skillsDeveloped: string[];
  durationMinutes: number;
  indoorOutdoor: "indoor" | "outdoor" | "either";
  reason?: string;
  imageData?: string;
  ageRecommendation?: string;
}

export interface DailyBriefDevelopment {
  domain: string;
  insight: string;
  tryToday: string;
  icon?: string;
  reason?: string;
}

export interface DailyBriefTip {
  topic: string;
  content: string;
  imageData?: string;
}

export interface DailyBriefStory {
  title: string;
  story: string;
  lengthMinutes: number;
  theme?: string;
  reason?: string;
  ageSuitability?: string;
  moral?: string;
  illustrationData?: string;
}

export interface TodayFocus {
  title: string;
  reason: string;
}

export interface WeeklyFocus {
  title: string;
  reason: string;
}

export interface DailyBriefMilestone {
  domain: string;
  milestone: string;
  whyItMatters: string;
  tip: string;
}

export interface DailyBriefLanguageSection {
  words: string[];
  conversationStarters: string[];
  miniGame: string;
  reason: string;
  domain?: string;
  icon?: string;
}

export interface DailyBriefParentTip {
  content: string;
  reason: string;
}

export interface WeatherInfo {
  city: string;
  tempC: number;
  description: string;
  icon: string;
  humidity: number;
  isRainy: boolean;
  playSuggestion: string;
}

export type WeatherError = "missing_key" | "invalid_key" | "city_not_found" | "api_error";

export interface DailyBriefContent {
  greeting: string;
  childAgeDisplay: string;
  weeklyFocus?: WeeklyFocus;
  todayFocus?: TodayFocus;
  recipe: DailyBriefRecipe;
  play: DailyBriefPlay;
  development: DailyBriefDevelopment[];
  languageSection?: DailyBriefLanguageSection;
  milestone?: DailyBriefMilestone;
  parentTip?: DailyBriefParentTip;
  developmentImage?: string;
  tip: DailyBriefTip;
  encouragement: string;
  bedtimeStory: DailyBriefStory;
  weatherNote?: string;
}

export interface LibraryRecommendation {
  title: string;
  summary: string;
  relevance: string;
}

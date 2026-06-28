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
}

export interface DailyBriefPlay {
  title: string;
  materials: string[];
  instructions: string[];
  skillsDeveloped: string[];
  durationMinutes: number;
  indoorOutdoor: "indoor" | "outdoor" | "either";
  imageData?: string;
  ageRecommendation?: string;
}

export interface DailyBriefDevelopment {
  domain: string;
  insight: string;
  tryToday: string;
  icon?: string;
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
  moral?: string;
  illustrationData?: string;
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

export interface DailyBriefContent {
  greeting: string;
  childAgeDisplay: string;
  recipe: DailyBriefRecipe;
  play: DailyBriefPlay;
  development: DailyBriefDevelopment[];
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

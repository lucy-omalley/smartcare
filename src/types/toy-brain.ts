import type { ToyCategory, ToyScanStatus } from "@prisma/client";

export type ToyDifficulty = "easy" | "medium" | "hard";
export type ToyMessLevel = "mess_free" | "low" | "medium" | "high";
export type ToyIndoorOutdoor = "indoor" | "outdoor" | "either";

export interface ToyPlayActivity {
  id: string;
  title: string;
  durationMinutes: number;
  difficulty: ToyDifficulty;
  indoorOutdoor: ToyIndoorOutdoor;
  messLevel: ToyMessLevel;
  prepMinutes: number;
  materials: string[];
  instructions: string[];
  parentTips: string[];
  questionsToAsk: string[];
  skills: string[];
  learningOutcomes: string[];
  cleanupTips: string[];
  safetyNotes: string[];
  heroEmoji: string;
  filters: string[];
}

export interface ToyIdentificationResult {
  name: string;
  category: ToyCategory;
  confidence: number;
  recommendedAge: string;
  description: string;
}

export interface ToyProfileView {
  id: string;
  name: string;
  category: ToyCategory;
  confidence: number | null;
  recommendedAge: string | null;
  description: string | null;
  photoData: string | null;
  mimeType: string | null;
  isConfirmed: boolean;
  isFavourite: boolean;
  activities: ToyPlayActivity[];
  addedToTodayAt: string | null;
  lastPlayedAt: string | null;
  scanStatus: ToyScanStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ToyBrainFeatures {
  isPremium: boolean;
  unlimitedScans: boolean;
  unlimitedActivities: boolean;
  aiPersonalization: boolean;
  todayPlanIntegration: boolean;
  printableCards: boolean;
  scansRemaining: number | null;
  maxActivitiesPerToy: number | null;
}

export interface ToyBrainFounderMetrics {
  totalToysScanned: number;
  confirmedToys: number;
  activitiesAddedToToday: number;
  favouriteToys: number;
  topCategories: Array<{ category: string; count: number }>;
  topActivities: Array<{ title: string; count: number }>;
  scansLast30Days: number;
  weeklyActiveToyBrainUsers: number;
  premiumConversionSignal: number;
}

export type ActivityFilter =
  | "5min"
  | "10min"
  | "20min"
  | "30min"
  | "45min"
  | "indoor"
  | "outdoor"
  | "mess_free"
  | "rainy_day"
  | "quick_setup"
  | "montessori"
  | "stem"
  | "language";

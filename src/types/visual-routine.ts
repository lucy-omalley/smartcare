import type {
  RoutineChallenge,
  RoutineLength,
  RoutineTemplateType,
  ScheduleDayType,
  ScheduleTimeOfDay,
} from "@prisma/client";

export interface RoutineStepPayload {
  title: string;
  instruction: string;
  iconEmoji: string;
  durationMinutes: number;
  rewardEmoji?: string;
  voiceInstruction?: string;
  isStoryTimeStep?: boolean;
}

export interface GeneratedRoutinePayload {
  title: string;
  steps: RoutineStepPayload[];
}

export interface RoutineStepView {
  id: string;
  orderIndex: number;
  title: string;
  instruction: string;
  iconEmoji: string;
  illustrationKey: string | null;
  durationMinutes: number;
  rewardEmoji: string;
  voiceInstruction: string | null;
  isStoryTimeStep: boolean;
}

export interface VisualRoutineView {
  id: string;
  title: string;
  templateType: RoutineTemplateType;
  childName: string | null;
  childAge: string | null;
  interests: string[];
  challenge: RoutineChallenge | null;
  length: RoutineLength;
  rewardsEnabled: boolean;
  isAiGenerated: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  steps: RoutineStepView[];
  schedules?: RoutineScheduleView[];
}

export interface RoutineScheduleView {
  id: string;
  routineId: string;
  timeOfDay: ScheduleTimeOfDay;
  dayType: ScheduleDayType;
  reminderTime: string | null;
  enabled: boolean;
}

export interface GenerateRoutineInput {
  userId: string;
  templateType: RoutineTemplateType;
  childName: string;
  childAge?: string | null;
  interests: string[];
  challenge: RoutineChallenge;
  length: RoutineLength;
  rewardsEnabled?: boolean;
}

export interface RoutineDashboardStats {
  totalCompletions: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  mostSuccessfulRoutine: { id: string; title: string; count: number } | null;
  mostSkippedStep: { title: string; count: number } | null;
  favouriteRoutine: { id: string; title: string } | null;
  weeklyConsistency: number;
  aiRecommendations: string[];
}

export type RoutineFeatures = {
  isPremium: boolean;
  routinesRemaining: number | null;
  unlimitedRoutines: boolean;
  aiPersonalization: boolean;
  familyVoiceEnabled: boolean;
  advancedAnalytics: boolean;
};

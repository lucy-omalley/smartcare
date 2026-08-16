import type {
  PosterCategory,
  PosterLayout,
  PosterParentGoal,
  PosterQrTarget,
  PosterTheme,
  RoutineChallenge,
  RoutineLength,
  RoutineTemplateType,
} from "@prisma/client";

export interface PosterStepPayload {
  title: string;
  iconEmoji: string;
  illustrationKey?: string;
  isStoryTimeStep?: boolean;
  isSongStep?: boolean;
}

export interface GeneratedPosterPayload {
  title: string;
  celebrationText: string;
  steps: PosterStepPayload[];
}

export interface PosterStepView {
  id: string;
  orderIndex: number;
  title: string;
  iconEmoji: string;
  illustrationKey: string | null;
  isStoryTimeStep: boolean;
  isSongStep: boolean;
}

export interface RoutinePosterView {
  id: string;
  title: string;
  childName: string | null;
  childAge: string | null;
  childGender: string | null;
  theme: PosterTheme;
  favouriteColours: string[];
  templateType: RoutineTemplateType;
  challenge: RoutineChallenge | null;
  length: RoutineLength;
  parentGoals: PosterParentGoal[];
  layout: PosterLayout;
  category: PosterCategory;
  celebrationText: string | null;
  rewardEnabled: boolean;
  parentSignature: string | null;
  stickerSpaceEnabled: boolean;
  qrTarget: PosterQrTarget;
  linkedRoutineId: string | null;
  isAiGenerated: boolean;
  printCount: number;
  qrScanCount: number;
  createdAt: string;
  updatedAt: string;
  steps: PosterStepView[];
}

export interface GeneratePosterInput {
  userId: string;
  templateType: RoutineTemplateType;
  childName: string;
  childAge?: string | null;
  childGender?: string | null;
  theme: PosterTheme;
  favouriteColours: string[];
  challenge: RoutineChallenge;
  length: RoutineLength;
  parentGoals: PosterParentGoal[];
  category?: PosterCategory;
  layout?: PosterLayout;
  rewardEnabled?: boolean;
  stickerSpaceEnabled?: boolean;
  parentSignature?: string | null;
  qrTarget?: PosterQrTarget;
}

export interface PosterThemeStyle {
  id: PosterTheme;
  label: string;
  emoji: string;
  headline: string;
  background: string;
  backgroundGradient: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  rewardEmoji: string;
  celebration: string;
  arrowColor: string;
  fontClass: string;
  isPremium: boolean;
}

export type PosterFeatures = {
  isPremium: boolean;
  postersRemaining: number | null;
  unlimitedPosters: boolean;
  aiPersonalization: boolean;
  unlimitedThemes: boolean;
  weeklyPlannerLayout: boolean;
  familyVoiceQr: boolean;
};

export interface PosterFounderMetrics {
  totalPostersCreated: number;
  aiGeneratedPosters: number;
  printsLast30Days: number;
  qrScansLast30Days: number;
  posterDownloadsLast30Days: number;
  averageQrScanRate: number;
  topRoutineTypes: Array<{ template: string; count: number }>;
  topThemes: Array<{ theme: string; count: number }>;
  mostPrintedPosters: Array<{ posterId: string; title: string; printCount: number }>;
  weeklyActivePosterUsers: number;
  premiumConversionSignal: number;
}

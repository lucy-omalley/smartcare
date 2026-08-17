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

export type {
  AdventureJourneyView as RoutinePosterView,
  AdventurePageView as PosterStepView,
  GenerateAdventureInput as GeneratePosterInput,
  AdventureFeatures as PosterFeatures,
  PosterThemeStyle,
} from "@/types/adventure-journey";

/** Legacy poster AI payload — distinct from adventure page payload */
export interface PosterStepPayload {
  title: string;
  iconEmoji: string;
  illustrationKey?: string;
  isStoryTimeStep?: boolean;
  isSongStep?: boolean;
}

export interface GeneratedPosterPayload {
  title: string;
  routineGoal: string;
  celebrationText: string;
  steps: PosterStepPayload[];
}

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
  adventuresGenerated?: number;
  adventureCompletionRate?: number;
}

/** @deprecated use GenerateAdventureInput from adventure-journey */
export interface LegacyGeneratePosterInput {
  userId: string;
  templateType: RoutineTemplateType;
  childName: string;
  childAge?: string | null;
  childGender?: string | null;
  numberOfChildren?: number;
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

import type {
  AdventureFormat,
  PosterCategory,
  PosterLayout,
  PosterParentGoal,
  PosterQrTarget,
  PosterTheme,
  RoutineChallenge,
  RoutineLength,
  RoutineTemplateType,
  StoryTheme,
} from "@prisma/client";

export interface AdventurePagePayload {
  storyText: string;
  missionLabel: string;
  title: string;
  iconEmoji: string;
  illustrationKey?: string;
  rewardStars?: number;
  isStoryTimeStep?: boolean;
  isSongStep?: boolean;
  pageQrTarget?: PosterQrTarget;
}

export interface GeneratedAdventurePayload {
  title: string;
  characterName: string;
  storyIntro: string;
  storyEnding: string;
  celebrationText: string;
  routineGoal: string;
  pages: AdventurePagePayload[];
}

export interface AdventurePageView {
  id: string;
  orderIndex: number;
  title: string;
  storyText: string | null;
  missionLabel: string | null;
  iconEmoji: string;
  illustrationKey: string | null;
  rewardStars: number;
  pageQrTarget: PosterQrTarget | null;
  isStoryTimeStep: boolean;
  isSongStep: boolean;
}

export interface AdventureJourneyView {
  id: string;
  title: string;
  routineGoal: string | null;
  characterName: string | null;
  storyIntro: string | null;
  storyEnding: string | null;
  storyTheme: StoryTheme;
  adventureFormat: AdventureFormat;
  totalRewardStars: number;
  adventurePoints: number;
  childName: string | null;
  childAge: string | null;
  childGender: string | null;
  numberOfChildren: number;
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
  /** Mission pages in story order */
  pages: AdventurePageView[];
  /** @deprecated alias for pages — kept for existing poster UI */
  steps: AdventurePageView[];
}

/** @deprecated use AdventureJourneyView */
export type RoutinePosterView = AdventureJourneyView;
/** @deprecated use AdventurePageView */
export type PosterStepView = AdventurePageView;

export interface GenerateAdventureInput {
  userId: string;
  templateType: RoutineTemplateType;
  childName: string;
  childAge?: string | null;
  childGender?: string | null;
  numberOfChildren?: number;
  interests: string[];
  theme: PosterTheme;
  storyTheme: StoryTheme;
  favouriteColours: string[];
  challenge: RoutineChallenge;
  length: RoutineLength;
  parentGoals: PosterParentGoal[];
  adventureFormat?: AdventureFormat;
  category?: PosterCategory;
  layout?: PosterLayout;
}

export type GeneratePosterInput = GenerateAdventureInput;

export type AdventureFeatures = {
  isPremium: boolean;
  adventuresRemaining: number | null;
  unlimitedAdventures: boolean;
  aiPersonalization: boolean;
  unlimitedThemes: boolean;
  familyVoiceStory: boolean;
  familyVoiceSong: boolean;
  adventureLibrary: boolean;
  /** @deprecated use adventuresRemaining */
  postersRemaining: number | null;
  /** @deprecated use unlimitedAdventures */
  unlimitedPosters: boolean;
  weeklyPlannerLayout: boolean;
  /** @deprecated use familyVoiceStory */
  familyVoiceQr: boolean;
};

export type PosterFeatures = AdventureFeatures;

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

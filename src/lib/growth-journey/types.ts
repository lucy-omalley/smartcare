/** Growth Journey V2 — parent-facing view models */

export type GrowthLifeStage = "baby" | "toddler" | "preschool" | "primary";

export type SkillDomain =
  | "emotional"
  | "communication"
  | "social"
  | "creativity"
  | "maths"
  | "fine_motor";

export interface GrowthSkillCard {
  id: SkillDomain;
  emoji: string;
  label: string;
  progress: number;
  encouragement: string;
}

export interface GrowthMission {
  title: string;
  summary: string;
  whyItMatters: string[];
  progressPercent: number;
  activitiesCompleted: number;
  activitiesTarget: number;
  estimatedMinutesLeft: number;
}

export interface GrowthTodaysMission {
  title: string;
  durationMinutes: number;
  toys: string[];
  skills: string[];
  difficulty: "Gentle" | "Moderate" | "Stretch";
  ageNote: string;
  reason: string;
  activityHref: string;
}

export interface GrowthMilestonePreview {
  id: string;
  title: string;
  activityHint?: string;
}

export interface GrowthRoadmapNode {
  id: string;
  label: string;
  emoji: string;
  status: "completed" | "current" | "upcoming";
}

export interface GrowthInterest {
  name: string;
  stars: number;
}

export interface GrowthSchoolReadinessDomain {
  id: string;
  label: string;
  status: "explore" | "growing" | "strong";
}

export interface GrowthTimelineEntry {
  id: string;
  label: string;
  when: string;
  emoji: string;
}

export interface GrowthCelebration {
  id: string;
  emoji: string;
  message: string;
}

export interface GrowthLearningCard {
  goal: string;
  why: string;
  activity: string;
  toyNeeded: string;
  timeMinutes: number;
  difficulty: string;
  skills: string[];
  outcome: string;
  href: string;
}

export interface GrowthJourneyView {
  childName: string;
  ageDisplay: string;
  lifeStage: GrowthLifeStage;
  stageLabel: string;
  growthTheme: string;
  weeklyProgressPercent: number;
  weeklyMission: GrowthMission;
  todaysMission: GrowthTodaysMission;
  skills: GrowthSkillCard[];
  nextMilestones: GrowthMilestonePreview[];
  roadmap: GrowthRoadmapNode[];
  coachInsight: string;
  coachAction: string;
  parentTip: string;
  parentTipReadSeconds: number;
  interests: GrowthInterest[];
  schoolReadiness: GrowthSchoolReadinessDomain[] | null;
  timeline: GrowthTimelineEntry[];
  celebrations: GrowthCelebration[];
  monthlyLetter: string | null;
  learningCards: GrowthLearningCard[];
  streakDays: number;
}

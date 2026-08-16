export const VOICE_USAGE_LIMITS = {
  premium: {
    maxVoiceProfiles: 4,
    voiceClonesPerMonth: 3,
    familyNarrationsPerMonth: 25,
  },
  beta: {
    maxVoiceProfiles: 2,
    voiceClonesPerMonth: 1,
    familyNarrationsPerMonth: 8,
  },
  free: {
    maxVoiceProfiles: 0,
    voiceClonesPerMonth: 0,
    familyNarrationsPerMonth: 0,
  },
} as const;

export type VoiceUsageTier = keyof typeof VOICE_USAGE_LIMITS | "unlimited";

export type VoiceUsageLimits = (typeof VOICE_USAGE_LIMITS)[Exclude<VoiceUsageTier, "unlimited">];

export type VoiceUsageSnapshot = {
  tier: VoiceUsageTier;
  limits: VoiceUsageLimits;
  voiceProfilesUsed: number;
  voiceClonesUsedThisMonth: number;
  familyNarrationsUsedThisMonth: number;
  voiceProfilesRemaining: number | null;
  voiceClonesRemainingThisMonth: number | null;
  familyNarrationsRemainingThisMonth: number | null;
};

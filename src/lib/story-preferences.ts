export interface StoryPreferences {
  childNickname?: string | null;
  favouriteAnimal?: string | null;
  favouriteVehicle?: string | null;
  favouriteCharacter?: string | null;
  storyLearningTheme?: string | null;
  storyMoralPreference?: string | null;
}

export function hasStoryPreferences(prefs?: StoryPreferences | null): boolean {
  if (!prefs) return false;
  return Boolean(
    prefs.favouriteAnimal?.trim() ||
      prefs.favouriteVehicle?.trim() ||
      prefs.favouriteCharacter?.trim() ||
      prefs.storyLearningTheme?.trim() ||
      prefs.storyMoralPreference?.trim()
  );
}

export function storyPreferenceLabels(prefs: StoryPreferences): string[] {
  const labels: string[] = [];
  if (prefs.favouriteAnimal?.trim()) labels.push(`🐾 ${prefs.favouriteAnimal.trim()}`);
  if (prefs.favouriteVehicle?.trim()) labels.push(`🚗 ${prefs.favouriteVehicle.trim()}`);
  if (prefs.favouriteCharacter?.trim()) labels.push(`⭐ ${prefs.favouriteCharacter.trim()}`);
  if (prefs.storyLearningTheme?.trim()) labels.push(`📚 ${prefs.storyLearningTheme.trim()}`);
  if (prefs.storyMoralPreference?.trim()) labels.push(`💡 ${prefs.storyMoralPreference.trim()}`);
  return labels;
}

import type {
  DailyBriefContent,
  DailyBriefLanguageSection,
} from "@/types/daily-brief";

/** Client-safe helpers for Today's Plan — no server imports. */

export function languageFromDevelopment(brief: DailyBriefContent): DailyBriefLanguageSection | null {
  if (brief.languageSection) return brief.languageSection;

  const development = brief.development ?? [];
  const langDev =
    development.find((d) => /language|speech/i.test(d.domain)) ?? development[0];
  if (!langDev) return null;

  return {
    words: langDev.tryToday.split(/[,;]/).map((w) => w.trim()).filter(Boolean).slice(0, 5),
    conversationStarters: [langDev.insight],
    miniGame: langDev.tryToday,
    reason: langDev.reason ?? "Supports speech development for this age.",
    domain: langDev.domain,
    icon: langDev.icon,
  };
}

export function normalizeBriefContent(brief: DailyBriefContent): DailyBriefContent {
  if (!brief?.recipe || !brief?.play || !brief?.bedtimeStory) {
    return brief;
  }

  const normalized: DailyBriefContent = {
    ...brief,
    development: brief.development ?? [],
  };

  if (!normalized.todayFocus && normalized.tip) {
    normalized.todayFocus = {
      title: normalized.tip.topic,
      reason: normalized.tip.content,
    };
  }

  if (!normalized.parentTip) {
    normalized.parentTip = {
      content: normalized.tip?.content ?? normalized.encouragement ?? "Take one small step today.",
      reason: "A practical coaching tip for today.",
    };
  }

  if (!normalized.milestone && normalized.development.length > 0) {
    const dev =
      normalized.development.find((d) => !/language|speech/i.test(d.domain)) ??
      normalized.development[0];
    normalized.milestone = {
      domain: dev.domain,
      milestone: dev.insight,
      whyItMatters: dev.insight,
      tip: dev.tryToday,
    };
  }

  if (!normalized.languageSection) {
    const lang = languageFromDevelopment(normalized);
    if (lang) normalized.languageSection = lang;
  }

  if (!normalized.play.reason && normalized.play.skillsDeveloped?.length) {
    normalized.play.reason = `Builds ${normalized.play.skillsDeveloped.slice(0, 2).join(" and ")}.`;
  }

  if (!normalized.bedtimeStory.reason) {
    normalized.bedtimeStory.reason = normalized.bedtimeStory.moral
      ? `A gentle story about ${normalized.bedtimeStory.moral.toLowerCase()}.`
      : "A personalised bedtime story for tonight.";
  }

  return normalized;
}

/** Fill in missing plan sections so meal / activity / story cards always render. */
export function repairBriefContent(
  brief: DailyBriefContent,
  defaults: DailyBriefContent
): DailyBriefContent {
  const valid = !!(
    brief?.recipe?.subtitle &&
    brief?.play?.title &&
    brief?.bedtimeStory?.title
  );
  if (valid) return normalizeBriefContent(brief);

  const repaired = normalizeBriefContent({
    ...defaults,
    ...brief,
    recipe: brief.recipe?.subtitle
      ? { ...defaults.recipe, ...brief.recipe }
      : defaults.recipe,
    play: brief.play?.title ? { ...defaults.play, ...brief.play } : defaults.play,
    bedtimeStory: brief.bedtimeStory?.title
      ? { ...defaults.bedtimeStory, ...brief.bedtimeStory }
      : defaults.bedtimeStory,
    development: brief.development?.length ? brief.development : defaults.development,
    weeklyFocus: brief.weeklyFocus ?? defaults.weeklyFocus,
    todayFocus: brief.todayFocus ?? defaults.todayFocus,
    tip: brief.tip ?? defaults.tip,
    encouragement: brief.encouragement ?? defaults.encouragement,
    greeting: brief.greeting ?? defaults.greeting,
    childAgeDisplay: brief.childAgeDisplay ?? defaults.childAgeDisplay,
    _rotationCounts: brief._rotationCounts ?? defaults._rotationCounts,
  });

  return isValidBriefContent(repaired) ? repaired : defaults;
}

export function isValidBriefContent(brief: DailyBriefContent | null | undefined): brief is DailyBriefContent {
  return !!(
    brief?.recipe?.subtitle &&
    brief?.play?.title &&
    brief?.bedtimeStory?.title
  );
}

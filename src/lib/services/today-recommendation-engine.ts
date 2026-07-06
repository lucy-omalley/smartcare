import { prisma } from "@/lib/db";
import { startOfWeek, format } from "date-fns";
import type { BriefMemory, BriefProfile } from "@/lib/daily-brief-context";
import type {
  DailyBriefContent,
  DailyBriefLanguageSection,
  WeeklyFocus,
  WeatherInfo,
} from "@/types/daily-brief";
import { weatherContextLine } from "@/lib/services/weather";

export interface AIMemorySignals {
  completedStories: string[];
  completedActivities: string[];
  savedMeals: string[];
  favouriteTopics: string[];
  skippedRecommendations: string[];
  recentMumbotTopics: string[];
}

const DEVELOPMENT_DOMAINS = [
  "Speech",
  "Social",
  "Emotional",
  "Fine Motor",
  "Gross Motor",
  "Cognitive",
  "Independence",
] as const;

/** Parse child age string into approximate months for stage detection. */
export function parseChildAgeMonths(childAge?: string | null, childBirthday?: string | null): number | null {
  if (childBirthday) {
    const birth = new Date(childBirthday);
    if (!Number.isNaN(birth.getTime())) {
      const now = new Date();
      const months =
        (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
      if (months >= 0 && months <= 216) return months;
    }
  }

  if (!childAge?.trim()) return null;
  const text = childAge.toLowerCase();

  const yearsMonths = text.match(/(\d+)\s*y(?:ear|rs)?(?:\s*(\d+)\s*m(?:onth|o)?)?/);
  if (yearsMonths) {
    const years = parseInt(yearsMonths[1], 10);
    const months = yearsMonths[2] ? parseInt(yearsMonths[2], 10) : 0;
    return years * 12 + months;
  }

  const monthsOnly = text.match(/(\d+)\s*m(?:onth|o)?/);
  if (monthsOnly) return parseInt(monthsOnly[1], 10);

  const yearsOnly = text.match(/(\d+)\s*y(?:ear|rs)?/);
  if (yearsOnly) return parseInt(yearsOnly[1], 10) * 12;

  return null;
}

/** Map age to recognised development stage label. */
export function getDevelopmentStage(childAge?: string | null, childBirthday?: string | null): string {
  const months = parseChildAgeMonths(childAge, childBirthday);
  if (months === null) return "Preschool (age unknown)";

  if (months < 6) return "0-6 months";
  if (months < 12) return "6-12 months";
  if (months < 24) return "1 year";
  if (months < 36) return "2 years";
  if (months < 48) return "3 years";
  if (months < 60) return "4 years";
  if (months < 72) return "5 years";
  return `${Math.floor(months / 12)} years`;
}

export function getWeekStartKey(date = new Date()): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export async function gatherAIMemorySignals(userId: string): Promise<AIMemorySignals> {
  const [savedRecipes, savedStories, recentBriefs, rotateEvents, mumbotEvents] = await Promise.all([
    prisma.savedRecipe.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { title: true },
    }),
    prisma.savedStory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { title: true },
    }),
    prisma.dailyBrief.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 7,
      select: { content: true },
    }),
    prisma.analyticsEvent.findMany({
      where: { userId, event: "today_refresh_clicked" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { properties: true },
    }),
    prisma.analyticsEvent.findMany({
      where: { userId, event: "mumbot_question_asked" },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { properties: true },
    }),
  ]);

  const completedStories: string[] = [];
  const completedActivities: string[] = [];
  const favouriteTopics = new Set<string>();

  for (const brief of recentBriefs) {
    const content = brief.content as unknown as DailyBriefContent;
    if (content?.bedtimeStory?.title) completedStories.push(content.bedtimeStory.title);
    if (content?.play?.title) completedActivities.push(content.play.title);
    if (content?.bedtimeStory?.theme) favouriteTopics.add(content.bedtimeStory.theme);
    content?.play?.skillsDeveloped?.forEach((s) => favouriteTopics.add(s));
  }

  for (const story of savedStories) {
    favouriteTopics.add(story.title);
  }

  const skippedRecommendations = rotateEvents
    .map((e) => {
      const props = e.properties as { section?: string } | null;
      return props?.section ? `${props.section} refresh` : null;
    })
    .filter((s): s is string => !!s);

  const recentMumbotTopics = mumbotEvents
    .map((e) => {
      const props = e.properties as { question?: string; prompt?: string } | null;
      const q = props?.question ?? props?.prompt;
      return typeof q === "string" ? q.slice(0, 120) : null;
    })
    .filter((s): s is string => !!s);

  return {
    completedStories,
    completedActivities,
    savedMeals: savedRecipes.map((r) => r.title),
    favouriteTopics: Array.from(favouriteTopics).slice(0, 12),
    skippedRecommendations,
    recentMumbotTopics,
  };
}

function profileBlock(profile: BriefProfile): string[] {
  const lines: string[] = [];
  if (profile.childNickname) lines.push(`Nickname: ${profile.childNickname}`);
  if (profile.childAge) lines.push(`Age: ${profile.childAge}`);
  if (profile.childBirthday) lines.push(`Birthday: ${profile.childBirthday}`);
  if (profile.childGender) lines.push(`Gender: ${profile.childGender}`);
  if (profile.childInterests?.length) lines.push(`Interests: ${profile.childInterests.join(", ")}`);
  if (profile.favouriteToys?.length) lines.push(`Favourite toys: ${profile.favouriteToys.join(", ")}`);
  if (profile.favouriteThemes?.length) lines.push(`Favourite themes: ${profile.favouriteThemes.join(", ")}`);
  if (profile.favouriteBooks?.length) lines.push(`Favourite books: ${profile.favouriteBooks.join(", ")}`);
  if (profile.favouriteFoods?.length) lines.push(`Favourite foods: ${profile.favouriteFoods.join(", ")}`);
  if (profile.foodPreferences?.length) lines.push(`Food preferences: ${profile.foodPreferences.join(", ")}`);
  if (profile.foodDislikes?.length) lines.push(`Food dislikes: ${profile.foodDislikes.join(", ")}`);
  if (profile.sleepRoutine) lines.push(`Sleep routine: ${profile.sleepRoutine}`);
  if (profile.schoolNursery) lines.push(`School / nursery: ${profile.schoolNursery}`);
  if (profile.personality) lines.push(`Personality: ${profile.personality}`);
  if (profile.homeLanguage) lines.push(`Language at home: ${profile.homeLanguage}`);
  if (profile.routineNotes) lines.push(`Routine notes: ${profile.routineNotes}`);
  if (profile.developmentNotes) lines.push(`Development notes: ${profile.developmentNotes}`);
  if (profile.location) lines.push(`Location (general): ${profile.location}`);
  if (profile.broadArea) lines.push(`Broad area: ${profile.broadArea}`);
  return lines;
}

/** Build weighted context for the unified Today's Plan recommendation engine. */
export function buildWeightedRecommendationContext(
  profile: BriefProfile,
  memories: BriefMemory[],
  recentMessages: string[],
  weeklyFocus: WeeklyFocus | null,
  memorySignals: AIMemorySignals,
  weather?: WeatherInfo | null
): string {
  const stage = getDevelopmentStage(profile.childAge, profile.childBirthday);
  const parts: string[] = [];

  parts.push("Generate ONE cohesive Today's Plan — every recommendation must come from the same reasoning.");
  parts.push("Weight your decisions: 40% child profile, 20% development stage, 15% parent goals, 15% current challenges, 10% AI memory.\n");

  parts.push("=== CHILD PROFILE (40%) ===");
  parts.push(`Parent name: ${profile.name ?? "Parent"}`);
  const profileLines = profileBlock(profile);
  parts.push(profileLines.length ? profileLines.join("\n") : "Limited profile — use age-appropriate defaults.");

  parts.push("\n=== DEVELOPMENT STAGE (20%) ===");
  parts.push(`Stage: ${stage}`);
  parts.push(`Milestone domains to consider: ${DEVELOPMENT_DOMAINS.join(", ")}`);
  parts.push("Base milestone recommendations on recognised child development guidance for this stage.");

  parts.push("\n=== PARENT GOALS (15%) ===");
  if (profile.priorityGoal) {
    parts.push(`Priority goal: ${profile.priorityGoal}`);
  }
  if (profile.parentingGoals?.length) {
    parts.push(`Goals: ${profile.parentingGoals.join(", ")}`);
  } else if (profile.parentingGoal) {
    parts.push(`Goal: ${profile.parentingGoal}`);
  } else {
    parts.push("No goals set — suggest gentle, universal development support.");
  }

  parts.push("\n=== CURRENT CHALLENGES (15%) ===");
  if (profile.currentChallenges?.length) {
    parts.push(`Challenges: ${profile.currentChallenges.join(", ")}`);
    parts.push("Gently support these challenges in meal, activity, story, and language choices.");
  } else {
    parts.push("No challenges listed — focus on strengths and stage-appropriate growth.");
  }

  parts.push("\n=== AI MEMORY & BEHAVIOUR (10%) ===");
  if (memorySignals.savedMeals.length) {
    parts.push(`Saved meals (liked): ${memorySignals.savedMeals.join("; ")}`);
  }
  if (memorySignals.completedStories.length) {
    parts.push(`Recent stories: ${memorySignals.completedStories.slice(0, 5).join("; ")}`);
  }
  if (memorySignals.completedActivities.length) {
    parts.push(`Recent activities: ${memorySignals.completedActivities.slice(0, 5).join("; ")}`);
  }
  if (memorySignals.favouriteTopics.length) {
    parts.push(`Favourite topics — recommend MORE of these: ${memorySignals.favouriteTopics.join(", ")}`);
  }
  if (memorySignals.skippedRecommendations.length) {
    parts.push(`Skipped/refreshed sections — reduce similar content: ${memorySignals.skippedRecommendations.join(", ")}`);
  }
  if (memorySignals.recentMumbotTopics.length) {
    parts.push(`Recent MumBot questions: ${memorySignals.recentMumbotTopics.join(" | ")}`);
  }

  if (memories.length) {
    parts.push("\nSaved family memories:");
    memories.forEach((m) => parts.push(`- [${m.category}] ${m.content}`));
  }

  if (recentMessages.length) {
    parts.push("\nRecent conversation snippets:");
    recentMessages.slice(-8).forEach((m) => parts.push(`- ${m.slice(0, 200)}`));
  }

  if (weeklyFocus) {
    parts.push("\n=== THIS WEEK'S FOCUS (must influence ALL recommendations) ===");
    parts.push(`Focus: ${weeklyFocus.title}`);
    parts.push(`Why: ${weeklyFocus.reason}`);
  }

  if (weather) {
    parts.push(`\n${weatherContextLine(weather)}`);
  }

  parts.push("\n=== OUTPUT RULES ===");
  parts.push("- Every section needs a one-line reason starting with 'Recommended because...'");
  parts.push("- Align meal, activity, story, language, milestone, and parent tip with todayFocus and weeklyFocus");
  parts.push("- Avoid repeating recent activities, stories, or meals listed above");
  parts.push("- Rotate themes; never feel generic or random");

  return parts.join("\n");
}

export function buildTodayPlanContextForMumBot(brief: DailyBriefContent, childName?: string | null): string {
  const name = childName || "your child";
  const lines: string[] = ["--- Today's Plan (parent is viewing this now) ---"];

  if (brief.weeklyFocus) {
    lines.push(`This week's focus: ${brief.weeklyFocus.title} — ${brief.weeklyFocus.reason}`);
  }
  if (brief.todayFocus) {
    lines.push(`Today's focus: ${brief.todayFocus.title} — ${brief.todayFocus.reason}`);
  }
  lines.push(`Meal: ${brief.recipe.subtitle} — ${brief.recipe.whyThisMeal}`);
  lines.push(`Activity: ${brief.play.title}${brief.play.reason ? ` — ${brief.play.reason}` : ""}`);
  lines.push(`Story: ${brief.bedtimeStory.title}${brief.bedtimeStory.reason ? ` — ${brief.bedtimeStory.reason}` : ""}`);

  const lang = brief.languageSection ?? languageFromDevelopment(brief);
  if (lang) {
    lines.push(`Language: words ${lang.words.join(", ")} — ${lang.reason}`);
  }
  if (brief.milestone) {
    lines.push(`Milestone: ${brief.milestone.milestone} (${brief.milestone.domain})`);
  }
  if (brief.parentTip) {
    lines.push(`Parent tip: ${brief.parentTip.content}`);
  }

  lines.push(`Child: ${name}, ${brief.childAgeDisplay}`);
  lines.push("The parent may ask to adapt, explain, or replace items from today's plan.");

  return lines.join("\n");
}

export function languageFromDevelopment(brief: DailyBriefContent): DailyBriefLanguageSection | null {
  if (brief.languageSection) return brief.languageSection;

  const langDev =
    brief.development.find((d) => /language|speech/i.test(d.domain)) ?? brief.development[0];
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
  const normalized = { ...brief };

  if (!normalized.todayFocus && normalized.tip) {
    normalized.todayFocus = {
      title: normalized.tip.topic,
      reason: normalized.tip.content,
    };
  }

  if (!normalized.parentTip) {
    normalized.parentTip = {
      content: normalized.tip?.content ?? normalized.encouragement,
      reason: "A practical coaching tip for today.",
    };
  }

  if (!normalized.milestone && normalized.development.length > 0) {
    const dev = normalized.development.find((d) => !/language|speech/i.test(d.domain)) ?? normalized.development[0];
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

  if (!normalized.play.reason && normalized.play.skillsDeveloped.length) {
    normalized.play.reason = `Builds ${normalized.play.skillsDeveloped.slice(0, 2).join(" and ")}.`;
  }

  if (!normalized.bedtimeStory.reason) {
    normalized.bedtimeStory.reason = normalized.bedtimeStory.moral
      ? `A gentle story about ${normalized.bedtimeStory.moral.toLowerCase()}.`
      : "A personalised bedtime story for tonight.";
  }

  return normalized;
}

export async function getOrCreateWeeklyFocus(
  userId: string,
  profile: BriefProfile,
  memories: BriefMemory[],
  memorySignals: AIMemorySignals,
  generateFocus: (context: string) => Promise<WeeklyFocus>
): Promise<WeeklyFocus> {
  const weekStart = getWeekStartKey();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      weeklyFocusTitle: true,
      weeklyFocusReason: true,
      weeklyFocusWeekStart: true,
    },
  });

  if (
    user?.weeklyFocusTitle &&
    user.weeklyFocusWeekStart &&
    format(user.weeklyFocusWeekStart, "yyyy-MM-dd") === weekStart
  ) {
    return {
      title: user.weeklyFocusTitle,
      reason: user.weeklyFocusReason ?? "Chosen to support your family's goals this week.",
    };
  }

  const context = buildWeightedRecommendationContext(
    profile,
    memories,
    [],
    null,
    memorySignals,
    null
  );

  const focus = await generateFocus(context);

  await prisma.user.update({
    where: { id: userId },
    data: {
      weeklyFocusTitle: focus.title,
      weeklyFocusReason: focus.reason,
      weeklyFocusWeekStart: new Date(weekStart),
    },
  });

  return focus;
}

export async function refreshWeeklyFocus(
  userId: string,
  profile: BriefProfile,
  memories: BriefMemory[],
  memorySignals: AIMemorySignals,
  generateFocus: (context: string) => Promise<WeeklyFocus>
): Promise<WeeklyFocus> {
  const weekStart = getWeekStartKey();
  const context = buildWeightedRecommendationContext(
    profile,
    memories,
    [],
    null,
    memorySignals,
    null
  );

  const focus = await generateFocus(`${context}\n\nGenerate a NEW weekly focus different from: ${profile.weeklyFocusTitle ?? "previous focus"}.`);

  await prisma.user.update({
    where: { id: userId },
    data: {
      weeklyFocusTitle: focus.title,
      weeklyFocusReason: focus.reason,
      weeklyFocusWeekStart: new Date(weekStart),
    },
  });

  return focus;
}

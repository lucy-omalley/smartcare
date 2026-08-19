import "server-only";

import { subDays, formatDistanceToNow } from "date-fns";
import { prisma } from "@/lib/db";
import { parseChildAgeMonths } from "@/lib/child-development";
import { resolveChildAgeDisplay } from "@/lib/child-age";
import { getTodayPageData } from "@/lib/services/today-page";
import type { BriefProfile } from "@/lib/daily-brief-context";
import {
  buildRoadmap,
  resolveLifeStage,
  SKILL_CATALOG,
} from "@/lib/growth-journey/stages";
import type {
  GrowthCelebration,
  GrowthInterest,
  GrowthJourneyView,
  GrowthLearningCard,
  GrowthSchoolReadinessDomain,
  GrowthTimelineEntry,
} from "@/lib/growth-journey/types";

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(n)));
}

function skillProgress(
  skillKeywords: string[],
  developmentText: string[],
  playSkills: string[],
  weeklyActivityCount: number,
  seed: number
): number {
  const haystack = [...developmentText, ...playSkills].join(" ").toLowerCase();
  const match = skillKeywords.some((k) => haystack.includes(k));
  const base = 35 + (seed % 25);
  const activityBoost = Math.min(weeklyActivityCount * 8, 32);
  const matchBoost = match ? 15 : 0;
  return clamp(base + activityBoost + matchBoost);
}

function interestStars(name: string, profileTags: string[], usageCount: number): number {
  const lower = name.toLowerCase();
  const inProfile = profileTags.some(
    (t) => t.toLowerCase().includes(lower) || lower.includes(t.toLowerCase())
  );
  if (usageCount >= 3) return 5;
  if (usageCount >= 2 || inProfile) return 4;
  if (inProfile) return 3;
  return 2;
}

function schoolReadinessStatus(score: number): "explore" | "growing" | "strong" {
  if (score >= 70) return "strong";
  if (score >= 45) return "growing";
  return "explore";
}

export async function getGrowthJourneyView(userId: string): Promise<GrowthJourneyView> {
  const weekAgo = subDays(new Date(), 7);

  const [todayData, user, milestones, memories, weeklyEvents] = await Promise.all([
    getTodayPageData(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        childNickname: true,
        childAge: true,
        childBirthday: true,
        childInterests: true,
        favouriteToys: true,
        favouriteAnimal: true,
        favouriteVehicle: true,
        favouriteCharacter: true,
        weeklyFocusTitle: true,
        weeklyFocusReason: true,
        name: true,
      },
    }),
    prisma.knowledgeMilestone.findMany({
      where: { active: true },
      orderBy: { minAgeMonths: "asc" },
      take: 40,
    }),
    prisma.familyMemory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, content: true, category: true, createdAt: true },
    }),
    prisma.analyticsEvent.findMany({
      where: {
        userId,
        createdAt: { gte: weekAgo },
        event: {
          in: [
            "activity_started",
            "activity_completed",
            "story_started",
            "story_completed",
            "learning_plan_generated",
          ],
        },
      },
      select: { event: true, createdAt: true },
    }),
  ]);

  if (!user) throw new Error("User not found");

  const brief = todayData.brief;
  const childName = user.childNickname ?? "your child";
  const ageDisplay = resolveChildAgeDisplay(user) ?? brief.childAgeDisplay ?? "preschool age";
  const ageMonths = parseChildAgeMonths(user.childAge, user.childBirthday);
  const { stage, label: stageLabel } = resolveLifeStage(user.childAge, user.childBirthday);

  const growthTheme =
    brief.weeklyFocus?.title ??
    user.weeklyFocusTitle ??
    brief.development[0]?.domain ??
    "Curiosity & Confidence";

  const weeklyActivityCount = weeklyEvents.filter((e) =>
    ["activity_started", "activity_completed", "story_completed"].includes(e.event)
  ).length;
  const activitiesTarget = 5;
  const activitiesCompleted = Math.min(weeklyActivityCount, activitiesTarget);
  const weeklyProgressPercent = clamp((activitiesCompleted / activitiesTarget) * 100);

  const developmentDomains = brief.development.map((d) => `${d.domain} ${d.insight}`);
  const playSkills = brief.play.skillsDeveloped ?? [];

  const skills = SKILL_CATALOG.map((s, i) => ({
    id: s.id,
    emoji: s.emoji,
    label: s.label,
    progress: skillProgress(s.keywords, developmentDomains, playSkills, weeklyActivityCount, userId.length + i * 7),
    encouragement:
      s.id === "emotional"
        ? "Naming feelings together builds calm."
        : s.id === "communication"
          ? "Every chat counts as practice."
          : "Small steps — big growth.",
  }));

  const ageFilteredMilestones = milestones.filter(
    (m) =>
      ageMonths === null ||
      (m.minAgeMonths <= ageMonths + 6 && m.maxAgeMonths >= ageMonths - 3)
  );

  const nextMilestones = ageFilteredMilestones.slice(0, 5).map((m) => ({
    id: m.slug,
    title: m.title,
    activityHint: m.parentTip?.slice(0, 80) ?? undefined,
  }));

  const profileTags = [
    ...(user.childInterests ?? []),
    ...(user.favouriteToys ?? []),
    user.favouriteAnimal,
    user.favouriteVehicle,
    user.favouriteCharacter,
  ].filter(Boolean) as string[];

  const interestCandidates = Array.from(
    new Set([...profileTags, "Music", "Drawing", "Animals"])
  ).slice(0, 6);

  const interests: GrowthInterest[] = interestCandidates.map((name) => ({
    name,
    stars: interestStars(
      name,
      profileTags,
      memories.filter((m) => m.content.toLowerCase().includes(name.toLowerCase())).length
    ),
  }));

  const fallbackTimeline: GrowthTimelineEntry[] = [
    {
      id: "today-play",
      label: `Today's activity: ${brief.play.title}`,
      when: "Today",
      emoji: "🎨",
    },
  ];
  if (brief.milestone) {
    fallbackTimeline.push({
      id: "milestone",
      label: brief.milestone.milestone,
      when: "This week",
      emoji: "🌱",
    });
  }

  const timeline: GrowthTimelineEntry[] =
    memories.length > 0
      ? memories.slice(0, 6).map((m) => ({
          id: m.id,
          label: m.content.slice(0, 120),
          when: formatDistanceToNow(m.createdAt, { addSuffix: true }),
          emoji: m.category === "MILESTONE" ? "🌱" : m.category === "LEARNING" ? "📚" : "✨",
        }))
      : fallbackTimeline;

  const celebrations: GrowthCelebration[] = [];
  if (activitiesCompleted >= 3) {
    celebrations.push({
      id: "missions",
      emoji: "🎉",
      message: `${childName} completed ${activitiesCompleted} learning missions this week!`,
    });
  }
  if (weeklyProgressPercent >= 60) {
    celebrations.push({
      id: "progress",
      emoji: "⭐",
      message: "Wonderful weekly progress — keep going!",
    });
  }

  const whyItMatters = [
    brief.weeklyFocus?.reason?.split(".")[0] ?? "Supports everyday confidence",
    brief.milestone?.whyItMatters?.split(".")[0] ?? "Builds school readiness",
    "Strengthens your parent-child bond",
  ].filter(Boolean) as string[];

  const topInterest = [...interests].sort((a, b) => b.stars - a.stars)[0]?.name ?? "play";
  const coachInsight = brief.development[0]?.insight
    ? `${childName} has shown lovely progress in ${brief.development[0].domain.toLowerCase()} recently.`
    : `${childName} is exploring the world with curiosity — a wonderful sign of healthy development.`;

  const coachAction =
    brief.development[0]?.tryToday ??
    `Because ${childName} enjoys ${topInterest.toLowerCase()}, try today's play mission together.`;

  const parentTip =
    brief.parentTip?.content ??
    `When ${childName} feels frustrated, try naming the emotion first — "I can see you're feeling disappointed."`;

  let schoolReadiness: GrowthSchoolReadinessDomain[] | null = null;
  if (ageMonths !== null && ageMonths >= 48 && ageMonths <= 96) {
    const domains = [
      { id: "language", label: "Language", keywords: ["language", "speech", "word"] },
      { id: "math", label: "Math", keywords: ["math", "count", "number"] },
      { id: "fine_motor", label: "Fine Motor", keywords: ["motor", "draw", "hand"] },
      { id: "self_care", label: "Self Care", keywords: ["routine", "independ"] },
      { id: "emotional", label: "Emotional", keywords: ["emotion", "feel", "calm"] },
      { id: "social", label: "Social", keywords: ["social", "friend", "share"] },
      { id: "confidence", label: "Confidence", keywords: ["confiden", "try", "brave"] },
    ];
    schoolReadiness = domains.map((d, i) => {
      const score = skillProgress(d.keywords, developmentDomains, playSkills, weeklyActivityCount, i * 11);
      return { id: d.id, label: d.label, status: schoolReadinessStatus(score) };
    });
  }

  const learningCards: GrowthLearningCard[] = [
    {
      goal: brief.todayFocus?.title ?? growthTheme,
      why: brief.todayFocus?.reason ?? brief.weeklyFocus?.reason ?? "Matches this week's growth theme",
      activity: brief.play.title,
      toyNeeded: brief.play.materials.slice(0, 2).join(", ") || "Everyday items at home",
      timeMinutes: brief.play.durationMinutes,
      difficulty: brief.play.durationMinutes <= 15 ? "Gentle" : "Moderate",
      skills: brief.play.skillsDeveloped?.slice(0, 3) ?? ["Curiosity"],
      outcome: brief.play.reason ?? "Joyful learning through play",
      href: "/today",
    },
  ];

  const streakDays = Math.min(
    7,
    new Set(weeklyEvents.map((e) => e.createdAt.toDateString())).size || (weeklyActivityCount > 0 ? 1 : 0)
  );

  const parentFirstName = user.name?.split(" ")[0] ?? "there";
  const monthlyLetter = user.weeklyFocusReason
    ? `Dear ${parentFirstName},\n\nThis month ${childName} has been growing beautifully — especially around ${growthTheme.toLowerCase()}. ${coachInsight} Next we'll gently build on ${brief.development[1]?.domain?.toLowerCase() ?? "play and connection"}.\n\nWith warmth,\nParenfy`
    : null;

  return {
    childName,
    ageDisplay,
    lifeStage: stage,
    stageLabel,
    growthTheme,
    weeklyProgressPercent,
    weeklyMission: {
      title: growthTheme,
      summary:
        user.weeklyFocusReason ??
        brief.weeklyFocus?.reason ??
        `Helping ${childName} grow through playful missions.`,
      whyItMatters: whyItMatters.slice(0, 4),
      progressPercent: weeklyProgressPercent,
      activitiesCompleted,
      activitiesTarget,
      estimatedMinutesLeft: Math.max(0, (activitiesTarget - activitiesCompleted) * 12),
    },
    todaysMission: {
      title: brief.play.title,
      durationMinutes: brief.play.durationMinutes,
      toys: user.favouriteToys?.slice(0, 2).length
        ? user.favouriteToys.slice(0, 2)
        : brief.play.materials.slice(0, 2),
      skills: playSkills.length ? playSkills : [growthTheme],
      difficulty:
        brief.play.durationMinutes <= 10
          ? "Gentle"
          : brief.play.durationMinutes <= 20
            ? "Moderate"
            : "Stretch",
      ageNote: ageDisplay,
      reason: `Because ${childName} loves ${topInterest.toLowerCase()}, we recommend this mission today.`,
      activityHref: "/today",
    },
    skills,
    nextMilestones,
    roadmap: buildRoadmap(stage, ageMonths),
    coachInsight,
    coachAction,
    parentTip,
    parentTipReadSeconds: 30,
    interests,
    schoolReadiness,
    timeline,
    celebrations,
    monthlyLetter,
    learningCards,
    streakDays,
  };
}

import { parseChildAgeMonths } from "@/lib/child-development";
import type { GrowthLifeStage } from "@/lib/growth-journey/types";

export function resolveLifeStage(
  childAge?: string | null,
  childBirthday?: string | null
): { stage: GrowthLifeStage; label: string } {
  const months = parseChildAgeMonths(childAge, childBirthday);
  if (months === null) {
    return { stage: "preschool", label: "Preschool Explorer" };
  }
  if (months < 12) return { stage: "baby", label: "Baby Discoverer" };
  if (months < 36) return { stage: "toddler", label: "Toddler Adventurer" };
  if (months < 72) return { stage: "preschool", label: "Preschool Explorer" };
  return { stage: "primary", label: "Primary School Learner" };
}

export const ROADMAP_BY_STAGE: Record<
  GrowthLifeStage,
  Array<{ id: string; label: string; emoji: string; minMonths: number }>
> = {
  baby: [
    { id: "birth", label: "Birth", emoji: "👶", minMonths: 0 },
    { id: "rolling", label: "Rolling", emoji: "🔄", minMonths: 4 },
    { id: "sitting", label: "Sitting", emoji: "🪑", minMonths: 6 },
    { id: "babbling", label: "Babbling", emoji: "🗣", minMonths: 8 },
    { id: "crawling", label: "Crawling", emoji: "🐛", minMonths: 10 },
  ],
  toddler: [
    { id: "walking", label: "Walking", emoji: "👣", minMonths: 12 },
    { id: "talking", label: "First Words", emoji: "💬", minMonths: 18 },
    { id: "pretend", label: "Pretend Play", emoji: "🎭", minMonths: 24 },
    { id: "independence", label: "Independence", emoji: "⭐", minMonths: 30 },
  ],
  preschool: [
    { id: "pretend", label: "Pretend Play", emoji: "🎭", minMonths: 36 },
    { id: "preschool", label: "Preschool", emoji: "🏫", minMonths: 48 },
    { id: "readiness", label: "School Readiness", emoji: "🎒", minMonths: 54 },
    { id: "confidence", label: "Confidence", emoji: "🌟", minMonths: 60 },
  ],
  primary: [
    { id: "reading", label: "Reading", emoji: "📖", minMonths: 72 },
    { id: "friendships", label: "Friendships", emoji: "🤝", minMonths: 78 },
    { id: "confidence", label: "Confidence", emoji: "🌟", minMonths: 84 },
    { id: "primary", label: "Primary School", emoji: "🎓", minMonths: 72 },
  ],
};

export function buildRoadmap(
  stage: GrowthLifeStage,
  ageMonths: number | null
): Array<{ id: string; label: string; emoji: string; status: "completed" | "current" | "upcoming" }> {
  const nodes = ROADMAP_BY_STAGE[stage];
  const months = ageMonths ?? 48;
  let currentIdx = 0;
  for (let i = 0; i < nodes.length; i++) {
    if (months >= nodes[i]!.minMonths) currentIdx = i;
  }
  return nodes.map((n, i) => ({
    id: n.id,
    label: n.label,
    emoji: n.emoji,
    status: i < currentIdx ? "completed" : i === currentIdx ? "current" : "upcoming",
  }));
}

export const SKILL_CATALOG: Array<{
  id: import("@/lib/growth-journey/types").SkillDomain;
  emoji: string;
  label: string;
  keywords: string[];
}> = [
  { id: "emotional", emoji: "😊", label: "Emotional Regulation", keywords: ["emotion", "feel", "calm", "self"] },
  { id: "communication", emoji: "🗣", label: "Communication", keywords: ["language", "speech", "word", "talk"] },
  { id: "social", emoji: "🤝", label: "Social Skills", keywords: ["social", "turn", "share", "friend"] },
  { id: "creativity", emoji: "🎨", label: "Creativity", keywords: ["creative", "imagine", "art", "story"] },
  { id: "maths", emoji: "🔢", label: "Early Maths", keywords: ["math", "count", "number", "sort"] },
  { id: "fine_motor", emoji: "✍", label: "Fine Motor", keywords: ["motor", "hand", "draw", "fine"] },
];

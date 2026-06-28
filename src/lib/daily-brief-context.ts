import { MemoryCategory } from "@prisma/client";

export interface BriefProfile {
  name?: string | null;
  childNickname?: string | null;
  childAge?: string | null;
  parentingGoal?: string | null;
}

export interface BriefMemory {
  content: string;
  category: MemoryCategory;
}

export function buildDailyBriefContext(
  profile: BriefProfile,
  memories: BriefMemory[],
  recentMessages: string[],
  weeklyFocus?: string | null
): string {
  const parts: string[] = [];

  parts.push(`Parent name: ${profile.name ?? "Parent"}`);
  if (profile.childNickname) parts.push(`Child nickname: ${profile.childNickname}`);
  if (profile.childAge) parts.push(`Child age: ${profile.childAge}`);
  if (profile.parentingGoal) parts.push(`Current parenting goal: ${profile.parentingGoal}`);
  if (weeklyFocus) parts.push(`Weekly focus: ${weeklyFocus}`);

  if (memories.length > 0) {
    parts.push("\nFamily memories:");
    memories.forEach((m) => parts.push(`- [${m.category}] ${m.content}`));
  }

  if (recentMessages.length > 0) {
    parts.push("\nRecent conversation snippets:");
    recentMessages.slice(-8).forEach((m) => parts.push(`- ${m.slice(0, 200)}`));
  }

  return parts.join("\n");
}

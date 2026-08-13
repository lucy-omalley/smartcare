import "server-only";

import { completeAI } from "@/lib/ai/provider";
import { prisma } from "@/lib/db";
import type { LearningPlanContent } from "@/types/learning-plan";

export async function generateLearningPlan(
  userId: string,
  options?: { durationMinutes?: number }
): Promise<LearningPlanContent> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      childNickname: true,
      childAge: true,
      childInterests: true,
      favouriteToys: true,
      parentingGoals: true,
      currentChallenges: true,
      storyLearningTheme: true,
    },
  });

  if (!user) throw new Error("User not found");

  const duration = options?.durationMinutes ?? 20;
  const childName = user.childNickname ?? "your child";

  const result = await completeAI({
    feature: "COACHING",
    userId,
    jsonMode: true,
    maxTokens: 900,
    temperature: 0.7,
    systemPrompt: `You are an expert early-years educator creating structured learning plans for parents.
Return JSON only with keys: learningObjective, activities (array of {title, durationMinutes, materials, steps}),
parentGuidance, questionsToAsk (array), extensionActivity, reflectionPrompt.
Make it practical, age-appropriate, and more structured than a generic chatbot answer.`,
    userPrompt: `Child: ${childName}, age ${user.childAge ?? "preschool"}.
Interests: ${user.childInterests.join(", ") || "general play"}.
Goals: ${user.parentingGoals.join(", ") || "development"}.
Challenges: ${user.currentChallenges.join(", ") || "none specified"}.
Available toys: ${user.favouriteToys.join(", ") || " everyday household items"}.
Learning theme: ${user.storyLearningTheme ?? "curiosity and confidence"}.
Session duration available: ${duration} minutes.`,
  });

  let content: LearningPlanContent;
  try {
    content = JSON.parse(result.content) as LearningPlanContent;
  } catch {
    content = {
      learningObjective: `Build ${childName}'s confidence through playful learning.`,
      activities: [
        {
          title: "Explore and sort",
          durationMinutes: duration,
          materials: ["Everyday objects", "Basket"],
          steps: ["Gather 5 safe objects", "Sort by colour or size", "Name each object together"],
        },
      ],
      parentGuidance: "Follow your child's pace and celebrate effort.",
      questionsToAsk: ["What do you notice?", "Which one is bigger?"],
      extensionActivity: "Draw the objects after sorting.",
      reflectionPrompt: "What did your child enjoy most?",
    };
  }

  await prisma.learningPlan.create({
    data: {
      userId,
      durationMinutes: duration,
      content: content as object,
    },
  });

  return content;
}

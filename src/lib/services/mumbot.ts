import OpenAI from "openai";
import { MemoryCategory } from "@prisma/client";
import { generateParentingTipStatic } from "@/lib/mumbot-messages";
import { OPENAI_MODEL, OPENAI_TEMPERATURE, OPENAI_MAX_TOKENS } from "@/lib/openai-config";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const MUMBOT_SYSTEM_PROMPT = `You are MumBot, an encouraging AI Co-Parent and AI Parenting Companion.

You support parents with practical, evidence-informed parenting guidance.
You reduce anxiety rather than increase it.
You celebrate small wins.
You speak warmly and conversationally.
You ask clarifying questions only when necessary.
You never diagnose medical conditions.
You advise parents to seek professional advice for urgent medical, developmental or safeguarding concerns.

When appropriate, suggest:
- Local community support
- Family activities and play ideas
- Bedtime routines
- Support for bilingual families

Keep responses practical, encouraging, and concise. Never call yourself a chatbot — you are an AI Co-Parent.

IMPORTANT: You only remember information after receiving explicit permission from the parent. Never assume you will remember something unless they confirm.`;

export interface ChatMessageInput {
  content: string;
  isUser: boolean;
}

export interface SuggestedMemory {
  content: string;
  category: MemoryCategory;
}

export interface MumBotResponse {
  response: string;
  suggestedMemory?: SuggestedMemory;
}

function buildMemoryContext(
  memories: { content: string; category: MemoryCategory }[],
  profile?: { name?: string | null; childNickname?: string | null; childAge?: string | null; parentingGoal?: string | null }
): string {
  const parts: string[] = [];

  if (profile) {
    parts.push(`Parent name: ${profile.name ?? "Parent"}`);
    if (profile.childNickname) parts.push(`Child nickname: ${profile.childNickname}`);
    if (profile.childAge) parts.push(`Child age: ${profile.childAge}`);
    if (profile.parentingGoal) parts.push(`Current parenting goal: ${profile.parentingGoal}`);
  }

  if (memories.length > 0) {
    parts.push("\nFamily memories the parent has saved:");
    memories.forEach((m) => parts.push(`- [${m.category}] ${m.content}`));
  }

  return parts.join("\n");
}

export async function getMumBotResponse(
  messages: ChatMessageInput[],
  context: {
    memories: { content: string; category: MemoryCategory }[];
    profile?: { name?: string | null; childNickname?: string | null; childAge?: string | null; parentingGoal?: string | null };
  }
): Promise<MumBotResponse> {
  const memoryContext = buildMemoryContext(context.memories, context.profile);

  const systemContent = `${MUMBOT_SYSTEM_PROMPT}

${memoryContext ? `\n--- Family Context ---\n${memoryContext}` : ""}

After your main response, if the conversation revealed a specific, useful fact about the family that would be worth remembering (like a preference, routine, allergy, milestone, or favourite thing), append a JSON block on a new line in this exact format:
[SUGGESTED_MEMORY:{"content":"...","category":"PREFERENCE"}]

Valid categories: MILESTONE, ROUTINE, PREFERENCE, LEARNING, BEHAVIOUR, FUNNY_MOMENT, CONCERN, FAVOURITE_THINGS

Only suggest a memory if it's genuinely useful and was clearly stated. Do not suggest memories for vague or uncertain information. Most responses should NOT include a suggested memory.`;

  const openAIMessages = [
    { role: "system" as const, content: systemContent },
    ...messages.map((msg) => ({
      role: msg.isUser ? ("user" as const) : ("assistant" as const),
      content: msg.content,
    })),
  ];

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: openAIMessages,
    temperature: OPENAI_TEMPERATURE,
    max_tokens: OPENAI_MAX_TOKENS,
  });

  const raw = completion.choices[0]?.message?.content || "I'm here whenever you need parenting advice or someone to think things through with. What's on your mind?";

  const memoryMatch = raw.match(/\[SUGGESTED_MEMORY:(\{.*?\})\]/s);
  let response = raw;
  let suggestedMemory: SuggestedMemory | undefined;

  if (memoryMatch) {
    response = raw.replace(/\[SUGGESTED_MEMORY:\{.*?\}\]/s, "").trim();
    try {
      const parsed = JSON.parse(memoryMatch[1]);
      if (parsed.content && parsed.category) {
        suggestedMemory = {
          content: parsed.content,
          category: parsed.category as MemoryCategory,
        };
      }
    } catch {
      // ignore malformed memory suggestion
    }
  }

  return { response, suggestedMemory };
}

export async function generateTodaysFocus(
  profile: { name?: string | null; childNickname?: string | null; childAge?: string | null; parentingGoal?: string | null },
  memories: { content: string; category: MemoryCategory }[]
): Promise<string> {
  const context = buildMemoryContext(memories, profile);

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: "You are MumBot. Write a single warm, practical parenting focus for today in 1-2 sentences. Be encouraging, not prescriptive.",
      },
      {
        role: "user",
        content: context || "General parenting support for a parent with a young child.",
      },
    ],
    temperature: 0.8,
    max_tokens: 150,
  });

  return completion.choices[0]?.message?.content || "Take a moment today to celebrate one small win with your child — even tiny progress counts.";
}

export async function generateWeeklyReflection(
  profile: { name?: string | null; childNickname?: string | null; parentingGoal?: string | null },
  memories: { content: string; category: MemoryCategory }[],
  recentMessages: string[]
): Promise<Record<string, string>> {
  const context = [
    buildMemoryContext(memories, profile),
    recentMessages.length > 0 ? `\nRecent conversations:\n${recentMessages.slice(-10).join("\n")}` : "",
  ].join("\n");

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: `You are MumBot writing a supportive weekly letter to a parent. Return JSON with these keys:
- parentingWins (⭐ Parenting Wins)
- learningProgress (🧠 Learning Progress)
- happyMoments (😊 Happy Moments)
- emotionalDevelopment (❤️ Emotional Development)
- nextWeekFocus (🎯 Next Week Focus)
- encouragement (💛 Encouragement for Parents)

Write warmly, like a supportive friend — not an assessment. Each section should be 2-3 sentences.`,
      },
      { role: "user", content: context || "A parent who has been using MumBot this week." },
    ],
    temperature: 0.8,
    max_tokens: 800,
    response_format: { type: "json_object" },
  });

  try {
    return JSON.parse(completion.choices[0]?.message?.content || "{}");
  } catch {
    return {
      parentingWins: "You've shown up for your family this week — that matters more than you know.",
      learningProgress: "Every conversation and every moment of play is building your child's world.",
      happyMoments: "Look for the small smiles and giggles — they're the treasures of the week.",
      emotionalDevelopment: "You're modelling kindness and patience, even on the hard days.",
      nextWeekFocus: "Pick one small goal and celebrate progress, not perfection.",
      encouragement: "You're doing a wonderful job. Parenting is hard, and you're not alone.",
    };
  }
}

export async function generateParentingTip(): Promise<string> {
  return generateParentingTipStatic();
}

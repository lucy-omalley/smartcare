import OpenAI from "openai";
import { MemoryCategory } from "@prisma/client";
import { generateParentingTipStatic } from "@/lib/mumbot-messages";
import { OPENAI_MODEL, OPENAI_TEMPERATURE, OPENAI_MAX_TOKENS } from "@/lib/openai-config";
import { buildDailyBriefContext, type BriefProfile, type BriefMemory } from "@/lib/daily-brief-context";
import type { DailyBriefContent, DailyBriefRecipe, DailyBriefPlay, LibraryRecommendation, WeatherInfo } from "@/types/daily-brief";
import { weatherContextLine } from "@/lib/services/weather";

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
- developmentProgress (🧠 Development Progress)
- eating (🍎 Eating)
- sleep (😴 Sleep)
- emotionalGrowth (😊 Emotional Growth)
- favouriteActivities (🎮 Favourite Activities)
- happyMoments (❤️ Happy Family Moments)
- nextWeekFocus (🎯 Focus Next Week)
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
      developmentProgress: "Every conversation and every moment of play is building your child's world.",
      eating: "Mealtimes are learning moments — keep offering variety without pressure.",
      sleep: "Consistent routines help little ones feel safe, even when nights are imperfect.",
      emotionalGrowth: "You're modelling kindness and patience, even on the hard days.",
      favouriteActivities: "The best activities are often the simplest — play, explore, and laugh together.",
      happyMoments: "Look for the small smiles and giggles — they're the treasures of the week.",
      nextWeekFocus: "Pick one small goal and celebrate progress, not perfection.",
      encouragement: "You're doing a wonderful job. Parenting is hard, and you're not alone.",
    };
  }
}

export async function generateParentingTip(): Promise<string> {
  return generateParentingTipStatic();
}

const DAILY_BRIEF_JSON_SCHEMA = `Return JSON with this exact structure:
{
  "greeting": "Warm good morning message using parent first name",
  "childAgeDisplay": "e.g. 3 years 2 months — formatted nicely from child age",
  "recipe": {
    "title": "Today's Healthy Lunch",
    "subtitle": "Meal name",
    "prepTimeMinutes": 15,
    "difficulty": "Easy",
    "nutritionalHighlights": ["Protein", "Vegetables"],
    "healthyTip": "One short healthy eating tip",
    "whyThisMeal": "1-2 sentences explaining why this suits this family",
    "ingredients": ["item1", "item2"],
    "steps": ["step1", "step2"]
  },
  "play": {
    "title": "Activity name",
    "materials": ["item1"],
    "instructions": ["step1"],
    "skillsDeveloped": ["Fine motor", "Language"],
    "durationMinutes": 20,
    "indoorOutdoor": "indoor" | "outdoor" | "either",
    "ageRecommendation": "e.g. 2-4 years"
  },
  "development": [
    { "domain": "Language", "icon": "💬", "insight": "Many children around this age begin...", "tryToday": "One practical activity" },
    { "domain": "Fine Motor", "insight": "...", "tryToday": "..." },
    { "domain": "Social", "insight": "...", "tryToday": "..." }
  ],
  "tip": { "topic": "Eating|Sleep|Tantrums|etc", "content": "Short practical evidence-informed tip" },
  "encouragement": "One warm supportive sentence for the parent",
  "weatherNote": "Optional one sentence about today's weather and how it affects the plan (omit if no weather)",
  "bedtimeStory": {
    "title": "Story title",
    "story": "Full bedtime story, child as main character, 3-5 min read",
    "lengthMinutes": 5,
    "moral": "Optional gentle moral"
  }
}`;

const BRIEF_TONE_RULES = `Rules:
- Never say "Your child should..." — prefer "Many children around this age begin..."
- Reduce anxiety, celebrate small wins, be warm and practical
- Personalise using family context (age, goals, memories, allergies if mentioned)
- Recipe: consider picky eating, quick prep (~15-30 min default)
- Play: age-appropriate, clear materials and steps; match indoorOutdoor to today's weather when provided
- Development: 3-4 domains max, each with tryToday action
- Bedtime story: child nickname as hero if provided; use favourite things from memories when available`;

function parseDailyBriefJson(raw: string): DailyBriefContent | null {
  try {
    const parsed = JSON.parse(raw) as DailyBriefContent;
    if (parsed.recipe && parsed.play && parsed.tip && parsed.encouragement) {
      return parsed;
    }
  } catch {
    // fall through
  }
  return null;
}

function defaultDailyBrief(profile: BriefProfile): DailyBriefContent {
  const child = profile.childNickname || "your little one";
  const parent = profile.name?.split(" ")[0] || "there";
  return {
    greeting: `Good morning, ${parent}! MumBot has prepared today's plan for you and ${child}.`,
    childAgeDisplay: profile.childAge || "Growing every day",
    recipe: {
      title: "Today's Healthy Lunch",
      subtitle: "Simple Veggie Pasta",
      prepTimeMinutes: 20,
      difficulty: "Easy",
      nutritionalHighlights: ["Vegetables", "Energy"],
      healthyTip: "Offer familiar foods alongside new ones — no pressure.",
      whyThisMeal: "A familiar pasta base with finely chopped vegetables — gentle introduction for picky eaters.",
      ingredients: ["Pasta", "Cherry tomatoes", "Peas", "Olive oil", "Cheese"],
      steps: ["Cook pasta.", "Sauté chopped veg until soft.", "Mix together and serve warm."],
    },
    play: {
      title: "Colour Treasure Hunt",
      materials: ["Coloured paper or toys", "A small basket"],
      instructions: ["Hide colourful items around one room.", "Give your child a colour to find.", "Celebrate each discovery together."],
      skillsDeveloped: ["Colour recognition", "Gross motor", "Turn-taking"],
      durationMinutes: 20,
      indoorOutdoor: "indoor",
      ageRecommendation: "2-5 years",
    },
    development: [
      { domain: "Language", icon: "💬", insight: "Many children around this age begin joining two words together and naming familiar objects.", tryToday: "Narrate what you're doing: 'Now we're putting on your blue shoes.'" },
      { domain: "Fine Motor", icon: "✋", insight: "Many children around this age begin stacking blocks and turning pages in board books.", tryToday: "Offer chunky crayons and paper for free scribbling." },
      { domain: "Social", icon: "🤝", insight: "Many children around this age begin imitating everyday actions they see at home.", tryToday: "Play 'copy me' with simple gestures like clapping or waving." },
    ],
    tip: { topic: "Connection", content: "Five minutes of undivided play can fill your child's emotional cup for hours." },
    encouragement: "You're doing a great job — small moments of presence matter more than perfection.",
    bedtimeStory: {
      title: `${child}'s Starlight Adventure`,
      story: `Once upon a time, ${child} discovered a tiny star that needed help finding its way home. With courage and kindness, ${child} guided the star through the night sky until it shone brightly again. And as ${child} drifted to sleep, the star twinkled just for them. Goodnight, ${child}.`,
      lengthMinutes: 5,
      moral: "Kindness lights up the world.",
    },
  };
}

export async function generateDailyBrief(
  profile: BriefProfile,
  memories: BriefMemory[],
  recentMessages: string[],
  weeklyFocus?: string | null,
  weather?: WeatherInfo | null
): Promise<DailyBriefContent> {
  const context = [
    buildDailyBriefContext(profile, memories, recentMessages, weeklyFocus),
    weather ? `\n${weatherContextLine(weather)}` : "",
  ].join("\n");

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: `You are MumBot, an encouraging AI Co-Parent preparing a personalised daily parenting brief.\n${BRIEF_TONE_RULES}\n${DAILY_BRIEF_JSON_SCHEMA}`,
      },
      {
        role: "user",
        content: context || "A parent with a young child seeking today's personalised plan.",
      },
    ],
    temperature: 0.85,
    max_tokens: 2500,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  return parseDailyBriefJson(raw) ?? defaultDailyBrief(profile);
}

export async function regenerateRecipe(
  profile: BriefProfile,
  memories: BriefMemory[],
  currentRecipe?: DailyBriefRecipe
): Promise<DailyBriefRecipe> {
  const context = buildDailyBriefContext(profile, memories, []);
  const avoid = currentRecipe ? `\nAvoid repeating: ${currentRecipe.subtitle}` : "";

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: `Generate ONE new personalised recipe as JSON: { "title", "subtitle", "prepTimeMinutes", "whyThisMeal", "ingredients": [], "steps": [] }. ${BRIEF_TONE_RULES}${avoid}`,
      },
      { role: "user", content: context },
    ],
    temperature: 0.9,
    max_tokens: 800,
    response_format: { type: "json_object" },
  });

  try {
    return JSON.parse(completion.choices[0]?.message?.content || "{}") as DailyBriefRecipe;
  } catch {
    return defaultDailyBrief(profile).recipe;
  }
}

export async function regeneratePlay(
  profile: BriefProfile,
  memories: BriefMemory[],
  currentPlay?: DailyBriefPlay,
  weather?: WeatherInfo | null
): Promise<DailyBriefPlay> {
  const context = [
    buildDailyBriefContext(profile, memories, []),
    weather ? `\n${weatherContextLine(weather)}` : "",
  ].join("\n");
  const avoid = currentPlay ? `\nAvoid repeating: ${currentPlay.title}` : "";

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: `Generate ONE new personalised play activity as JSON: { "title", "materials": [], "instructions": [], "skillsDeveloped": [], "durationMinutes", "indoorOutdoor" }. ${BRIEF_TONE_RULES}${avoid}`,
      },
      { role: "user", content: context },
    ],
    temperature: 0.9,
    max_tokens: 800,
    response_format: { type: "json_object" },
  });

  try {
    return JSON.parse(completion.choices[0]?.message?.content || "{}") as DailyBriefPlay;
  } catch {
    return defaultDailyBrief(profile).play;
  }
}

export async function generateJournalEntry(
  profile: BriefProfile,
  parentSentence: string
): Promise<string> {
  const child = profile.childNickname || "your child";
  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: `You are MumBot writing a warm family memory journal entry. Expand the parent's one sentence into 2-3 beautiful sentences. Use the child's name (${child}) naturally. End with a gentle reflective line about growth or joy. Never be preachy.`,
      },
      { role: "user", content: parentSentence },
    ],
    temperature: 0.8,
    max_tokens: 200,
  });

  return completion.choices[0]?.message?.content?.trim() || parentSentence;
}

export async function generateLibraryRecommendations(
  profile: BriefProfile,
  memories: BriefMemory[],
  recentMessages: string[]
): Promise<LibraryRecommendation[]> {
  const context = buildDailyBriefContext(profile, memories, recentMessages);

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: `You are MumBot. Return JSON: { "recommendations": [{ "title": "...", "summary": "2-3 practical sentences", "relevance": "Why this fits this family now" }] }. Provide 5-6 personalised parenting topics — not generic articles. Topics like: Managing Tantrums, Speech Development, Healthy Lunches, Preschool Prep, Toilet Training. Warm, practical, evidence-informed tone.`,
      },
      { role: "user", content: context || "Parent with young child." },
    ],
    temperature: 0.75,
    max_tokens: 1200,
    response_format: { type: "json_object" },
  });

  try {
    const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
    return (parsed.recommendations as LibraryRecommendation[]) || [];
  } catch {
    return [];
  }
}

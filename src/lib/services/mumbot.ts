import OpenAI from "openai";
import { MemoryCategory } from "@prisma/client";
import { generateParentingTipStatic } from "@/lib/mumbot-messages";
import { OPENAI_MODEL, OPENAI_TEMPERATURE, OPENAI_MAX_TOKENS } from "@/lib/openai-config";
import { buildDailyBriefContext, type BriefProfile, type BriefMemory } from "@/lib/daily-brief-context";
import { withRecipeSampleLinks } from "@/lib/recipe-sample-links";
import { normalizeBriefContent } from "@/lib/today-plan-utils";
import type { DailyBriefContent, DailyBriefRecipe, DailyBriefPlay, DailyBriefStory, DailyBriefDevelopment, LibraryRecommendation, WeatherInfo, WeeklyFocus } from "@/types/daily-brief";
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
  profile?: {
    name?: string | null;
    childNickname?: string | null;
    childAge?: string | null;
    childInterests?: string[];
    foodPreferences?: string[];
    routineNotes?: string | null;
    parentingGoal?: string | null;
    parentingGoals?: string[];
    currentChallenges?: string[];
  }
): string {
  const parts: string[] = [];

  if (profile) {
    parts.push(`Parent name: ${profile.name ?? "Parent"}`);
    if (profile.childNickname) parts.push(`Child nickname: ${profile.childNickname}`);
    if (profile.childAge) parts.push(`Child age: ${profile.childAge}`);
    if (profile.childInterests?.length) parts.push(`Child interests: ${profile.childInterests.join(", ")}`);
    if (profile.foodPreferences?.length) parts.push(`Food preferences: ${profile.foodPreferences.join(", ")}`);
    if (profile.routineNotes) parts.push(`Routine notes: ${profile.routineNotes}`);
    if (profile.parentingGoals?.length) {
      parts.push(`Parenting goals: ${profile.parentingGoals.join(", ")}`);
    } else if (profile.parentingGoal) {
      parts.push(`Current parenting goal: ${profile.parentingGoal}`);
    }
    if (profile.currentChallenges?.length) {
      parts.push(`Current challenges: ${profile.currentChallenges.join(", ")}`);
    }
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
    profile?: {
      name?: string | null;
      childNickname?: string | null;
      childAge?: string | null;
      childInterests?: string[];
      foodPreferences?: string[];
      routineNotes?: string | null;
      parentingGoal?: string | null;
      parentingGoals?: string[];
      currentChallenges?: string[];
    };
    todayPlanContext?: string;
  }
): Promise<MumBotResponse> {
  const memoryContext = buildMemoryContext(context.memories, context.profile);

  const systemContent = `${MUMBOT_SYSTEM_PROMPT}

${memoryContext ? `\n--- Family Context ---\n${memoryContext}` : ""}
${context.todayPlanContext ? `\n${context.todayPlanContext}` : ""}

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
  }).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Incorrect API key") || msg.includes("invalid_api_key")) {
      throw new Error("OpenAI API key is invalid. Check OPENAI_API_KEY in Vercel settings.");
    }
    if (msg.includes("quota") || msg.includes("billing")) {
      throw new Error("OpenAI quota exceeded. Please check your OpenAI billing.");
    }
    throw err;
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
  "weeklyFocus": { "title": "This week's development focus", "reason": "Why this focus fits now" },
  "todayFocus": { "title": "One main focus for today e.g. Practising Sharing", "reason": "Explain WHY — link to goals, stage, or challenges" },
  "recipe": {
    "title": "Today's Healthy Lunch",
    "subtitle": "Meal name",
    "prepTimeMinutes": 15,
    "difficulty": "Easy",
    "nutritionalHighlights": ["Protein", "Vegetables"],
    "healthyTip": "One short healthy eating tip",
    "healthyAlternative": "Simple swap if child refuses",
    "whyThisMeal": "Recommended because... (personalised reason)",
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
    "ageRecommendation": "e.g. 2-4 years",
    "reason": "Recommended because... (link to interests, focus, or goals)"
  },
  "languageSection": {
    "words": ["word1", "word2"],
    "conversationStarters": ["Try asking...", "During play say..."],
    "miniGame": "One short speech game",
    "reason": "Recommended because...",
    "domain": "Language",
    "icon": "💬"
  },
  "milestone": {
    "domain": "Social",
    "milestone": "What many children this age begin doing",
    "whyItMatters": "Why this milestone matters",
    "tip": "One practical parenting tip for today"
  },
  "parentTip": {
    "content": "One coaching tip for today",
    "reason": "Recommended because..."
  },
  "development": [
    { "domain": "Language", "icon": "💬", "insight": "Many children around this age begin...", "tryToday": "One practical activity", "reason": "Recommended because..." }
  ],
  "tip": { "topic": "Eating|Sleep|Tantrums|etc", "content": "Short practical evidence-informed tip" },
  "encouragement": "One warm supportive sentence for the parent",
  "weatherNote": "Optional one sentence about today's weather and how it affects the plan (omit if no weather)",
  "bedtimeStory": {
    "title": "Story title",
    "theme": "e.g. Friendship, Courage",
    "reason": "Recommended because...",
    "ageSuitability": "e.g. 2-4 years",
    "story": "Full bedtime story, child as main character, 3-5 min read",
    "lengthMinutes": 5,
    "moral": "Optional gentle moral"
  }
}`;

const BRIEF_TONE_RULES = `Rules:
- ONE unified plan — meal, activity, story, language, milestone, and parent tip must align with todayFocus and weeklyFocus
- Never say "Your child should..." — prefer "Many children around this age begin..."
- Reduce anxiety, celebrate small wins, be warm and practical
- Personalise using family context (age, goals, memories, allergies if mentioned)
- EVERY recommendation needs a "reason" or "whyThisMeal" starting with "Recommended because..."
- Recipe: consider picky eating, quick prep (~15-30 min default)
- Play: age-appropriate, clear materials and steps; match indoorOutdoor to today's weather when provided
- Language: natural speech support with words, conversation starters, and a mini game
- Milestone: one age-appropriate domain from Speech, Social, Emotional, Fine Motor, Gross Motor, Cognitive, Independence
- Bedtime story: child nickname as hero if provided; use favourite things from memories when available
- Do NOT repeat recent activities, stories, or meals from the context
- Rotate themes across days`;

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

export function defaultDailyBrief(profile: BriefProfile, weeklyFocus?: WeeklyFocus): DailyBriefContent {
  const child = profile.childNickname || "your little one";
  const parent = profile.name?.split(" ")[0] || "there";
  const goal = profile.priorityGoal ?? profile.parentingGoals?.[0] ?? "connection";
  const brief: DailyBriefContent = {
    greeting: `Good morning, ${parent}! Here's today's plan for you and ${child}.`,
    childAgeDisplay: profile.childAge || "Growing every day",
    weeklyFocus: weeklyFocus ?? {
      title: "Building Connection",
      reason: "Small moments of presence strengthen your bond this week.",
    },
    todayFocus: {
      title: "Practising Connection",
      reason: `Recommended because you selected ${goal} as a focus and ${child} thrives with warm, predictable routines.`,
    },
    recipe: {
      title: "Today's Healthy Lunch",
      subtitle: "Simple Veggie Pasta",
      prepTimeMinutes: 20,
      difficulty: "Easy",
      nutritionalHighlights: ["Vegetables", "Energy"],
      healthyTip: "Offer familiar foods alongside new ones — no pressure.",
      healthyAlternative: "Serve plain pasta with cheese on the side.",
      whyThisMeal: "Recommended because a familiar pasta base with finely chopped vegetables is gentle for picky eaters.",
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
      reason: `Recommended because it builds language and imagination while matching ${child}'s energy indoors.`,
    },
    languageSection: {
      words: ["find", "colour", "more", "here"],
      conversationStarters: ["What colour did you find?", "Can you show me where it was hiding?"],
      miniGame: "Name each colour as you put treasures in the basket.",
      reason: "Recommended because naming colours during play supports everyday speech.",
      domain: "Language",
      icon: "💬",
    },
    milestone: {
      domain: "Social",
      milestone: "Many children around this age begin learning to take turns during simple games.",
      whyItMatters: "Turn-taking builds patience and early cooperation skills.",
      tip: "Try playing a simple 'your turn, my turn' game with a toy or snack.",
    },
    parentTip: {
      content: "Today, try giving two choices instead of open questions — 'red cup or blue cup?'",
      reason: "Recommended because clear choices reduce overwhelm and support independence.",
    },
    development: [
      { domain: "Language", icon: "💬", insight: "Many children around this age begin joining two words together and naming familiar objects.", tryToday: "Narrate what you're doing: 'Now we're putting on your blue shoes.'", reason: "Recommended because repetition during routines builds vocabulary." },
      { domain: "Fine Motor", icon: "✋", insight: "Many children around this age begin stacking blocks and turning pages in board books.", tryToday: "Offer chunky crayons and paper for free scribbling.", reason: "Recommended because scribbling strengthens hand muscles for writing later." },
      { domain: "Social", icon: "🤝", insight: "Many children around this age begin imitating everyday actions they see at home.", tryToday: "Play 'copy me' with simple gestures like clapping or waving.", reason: "Recommended because imitation is a foundation for social learning." },
    ],
    tip: { topic: "Connection", content: "Five minutes of undivided play can fill your child's emotional cup for hours." },
    encouragement: "You're doing a great job — small moments of presence matter more than perfection.",
    bedtimeStory: {
      title: `${child}'s Starlight Adventure`,
      theme: "Kindness",
      reason: `Recommended because a gentle adventure helps ${child} wind down while celebrating courage.`,
      ageSuitability: profile.childAge ?? "2-5 years",
      story: `Once upon a time, ${child} discovered a tiny star that needed help finding its way home. With courage and kindness, ${child} guided the star through the night sky until it shone brightly again. And as ${child} drifted to sleep, the star twinkled just for them. Goodnight, ${child}.`,
      lengthMinutes: 5,
      moral: "Kindness lights up the world.",
    },
  };
  return brief;
}

export async function generateWeeklyFocus(context: string): Promise<WeeklyFocus> {
  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: `You are MumBot. Generate ONE weekly development focus for a family. Return JSON: { "title": "e.g. Emotional Regulation", "reason": "1-2 sentences why this focus fits their goals, stage, and challenges now" }. Be warm and specific — not generic.`,
      },
      { role: "user", content: context },
    ],
    temperature: 0.7,
    max_tokens: 200,
    response_format: { type: "json_object" },
  });

  try {
    return JSON.parse(completion.choices[0]?.message?.content || "{}") as WeeklyFocus;
  } catch {
    return {
      title: "Building Confidence",
      reason: "Small daily wins help children feel capable and secure.",
    };
  }
}

export interface TodayPlanContext {
  weightedContext: string;
  weeklyFocus: WeeklyFocus;
  todayFocus?: { title: string; reason: string };
}

function rotateFocusLock(context: TodayPlanContext): string {
  const lines = [`Keep weeklyFocus: "${context.weeklyFocus.title}"`, `Keep todayFocus: "${context.todayFocus?.title ?? "unchanged"}"`];
  if (context.todayFocus?.reason) lines.push(`Today focus reason: ${context.todayFocus.reason}`);
  return lines.join("\n");
}

export async function generateDailyBrief(
  planContext: TodayPlanContext,
  profile: BriefProfile
): Promise<DailyBriefContent> {
  const context = [
    planContext.weightedContext,
    `\nUse this weeklyFocus in output: ${JSON.stringify(planContext.weeklyFocus)}`,
  ].join("\n");

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: `You are MumBot, an encouraging AI Co-Parent preparing ONE unified personalised Today's Plan.\n${BRIEF_TONE_RULES}\n${DAILY_BRIEF_JSON_SCHEMA}`,
      },
      {
        role: "user",
        content: context || "A parent with a young child seeking today's personalised plan.",
      },
    ],
    temperature: 0.85,
    max_tokens: 3200,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  const parsed = parseDailyBriefJson(raw);
  if (!parsed) return normalizeBriefContent(defaultDailyBrief(profile, planContext.weeklyFocus));

  parsed.weeklyFocus = planContext.weeklyFocus;
  return normalizeBriefContent(parsed);
}

export async function regenerateRecipe(
  profile: BriefProfile,
  memories: BriefMemory[],
  currentRecipe?: DailyBriefRecipe,
  planContext?: TodayPlanContext,
  attempt = 0
): Promise<DailyBriefRecipe> {
  const context = planContext?.weightedContext ?? buildDailyBriefContext(profile, memories, []);
  const focusLock = planContext ? `\n${rotateFocusLock(planContext)}\nDo NOT change todayFocus or weeklyFocus.` : "";
  const avoid = currentRecipe
    ? `\nDo NOT repeat or closely resemble this recipe. Use a different name, ingredients, and steps:\n- Title: ${currentRecipe.subtitle}\n- Ingredients: ${currentRecipe.ingredients.slice(0, 6).join(", ")}`
    : "";
  const variation =
    attempt > 0
      ? `\nCRITICAL: Previous suggestion was too similar. Pick a completely different meal type and cooking style (attempt ${attempt + 1}).`
      : "";

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: `Generate ONE new personalised recipe as JSON: { "title", "subtitle", "prepTimeMinutes", "whyThisMeal", "ingredients": [], "steps": [], "healthyTip": "optional", "healthyAlternative": "optional" }. whyThisMeal must start with "Recommended because". Keep steps short (3-4). Must be clearly different from the current suggestion. ${BRIEF_TONE_RULES}${focusLock}${avoid}${variation}`,
      },
      { role: "user", content: context },
    ],
    temperature: Math.min(0.88 + attempt * 0.06, 1),
    max_tokens: 550,
    response_format: { type: "json_object" },
  });

  try {
    return JSON.parse(completion.choices[0]?.message?.content || "{}") as DailyBriefRecipe;
  } catch {
    return defaultDailyBrief(profile).recipe;
  }
}

export async function generateRecipeFromFridge(
  profile: BriefProfile,
  memories: BriefMemory[],
  ingredients: string[],
  options?: {
    mealPreferences?: string[];
    avoidRecipe?: DailyBriefRecipe;
  }
): Promise<DailyBriefRecipe> {
  const context = buildDailyBriefContext(profile, memories, []);
  const fridgeList = ingredients.join(", ");
  const prefs = options?.mealPreferences?.filter(Boolean) ?? [];
  const prefLine = prefs.length
    ? `\nMeal style preferences (honour these): ${prefs.join(", ")}.`
    : "";
  const avoid = options?.avoidRecipe
    ? `\nAvoid repeating this recipe: "${options.avoidRecipe.subtitle}". Suggest something different.`
    : "";

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: `Create ONE child-friendly meal or recipe using these fridge ingredients as the main focus: ${fridgeList}. You may add small pantry staples (oil, salt, herbs) only if needed.${prefLine}${avoid} Return JSON: { "title", "subtitle", "prepTimeMinutes", "whyThisMeal", "ingredients": [], "steps": [], "healthyTip": "optional" }. Keep steps short (3-4). Make it practical for a busy parent. ${BRIEF_TONE_RULES}`,
      },
      { role: "user", content: `${context}\n\nAvailable from the fridge: ${fridgeList}${prefLine}` },
    ],
    temperature: 0.85,
    max_tokens: 650,
    response_format: { type: "json_object" },
  });

  try {
    type RawFridgeRecipe = Omit<DailyBriefRecipe, "sampleLinks">;
    const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}") as RawFridgeRecipe;
    const recipe: DailyBriefRecipe = {
      title: parsed.title,
      subtitle: parsed.subtitle,
      prepTimeMinutes: parsed.prepTimeMinutes,
      whyThisMeal: parsed.whyThisMeal,
      ingredients: parsed.ingredients ?? [],
      steps: parsed.steps ?? [],
      healthyTip: parsed.healthyTip,
      fromFridge: true,
    };
    return await withRecipeSampleLinks(recipe);
  } catch {
    return await withRecipeSampleLinks({ ...defaultDailyBrief(profile).recipe, fromFridge: true });
  }
}

export async function regeneratePlay(
  profile: BriefProfile,
  memories: BriefMemory[],
  currentPlay?: DailyBriefPlay,
  weather?: WeatherInfo | null,
  planContext?: TodayPlanContext,
  attempt = 0
): Promise<DailyBriefPlay> {
  const context = [
    planContext?.weightedContext ?? buildDailyBriefContext(profile, memories, []),
    weather ? `\n${weatherContextLine(weather)}` : "",
  ].join("\n");
  const focusLock = planContext ? `\n${rotateFocusLock(planContext)}\nDo NOT change todayFocus or weeklyFocus.` : "";
  const avoid = currentPlay
    ? `\nDo NOT repeat or closely resemble this activity:\n- Title: ${currentPlay.title}\n- Steps: ${currentPlay.instructions.slice(0, 3).join(" ")}`
    : "";
  const variation =
    attempt > 0
      ? `\nCRITICAL: Previous suggestion was too similar. Pick a completely different activity type (attempt ${attempt + 1}).`
      : "";

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: `Generate ONE new personalised play activity as JSON: { "title", "materials": [], "instructions": [], "skillsDeveloped": [], "durationMinutes", "indoorOutdoor", "ageRecommendation", "reason": "Recommended because..." }. Keep instructions to 3-4 short steps. Must be clearly different from the current suggestion. ${BRIEF_TONE_RULES}${focusLock}${avoid}${variation}`,
      },
      { role: "user", content: context },
    ],
    temperature: Math.min(0.88 + attempt * 0.06, 1),
    max_tokens: 550,
    response_format: { type: "json_object" },
  });

  try {
    return JSON.parse(completion.choices[0]?.message?.content || "{}") as DailyBriefPlay;
  } catch {
    return defaultDailyBrief(profile).play;
  }
}

export async function regenerateStory(
  profile: BriefProfile,
  memories: BriefMemory[],
  currentStory?: DailyBriefStory,
  planContext?: TodayPlanContext,
  attempt = 0
): Promise<DailyBriefStory> {
  const context = planContext?.weightedContext ?? buildDailyBriefContext(profile, memories, []);
  const focusLock = planContext ? `\n${rotateFocusLock(planContext)}\nDo NOT change todayFocus or weeklyFocus.` : "";
  const avoid = currentStory
    ? `\nDo NOT repeat or closely resemble this story:\n- Title: ${currentStory.title}\n- Theme: ${currentStory.theme ?? "unknown"}`
    : "";
  const variation =
    attempt > 0
      ? `\nCRITICAL: Previous suggestion was too similar. Write a completely different plot and title (attempt ${attempt + 1}).`
      : "";
  const child = profile.childNickname || "the child";

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: `Generate ONE new personalised bedtime story as JSON: { "title", "theme", "reason": "Recommended because...", "ageSuitability", "story": "concise story ~2 min read", "lengthMinutes": 2, "moral": "gentle moral" }. ${child} is the hero. Keep story under 400 words. Must be clearly different from the current suggestion. ${BRIEF_TONE_RULES}${focusLock}${avoid}${variation}`,
      },
      { role: "user", content: context },
    ],
    temperature: Math.min(0.9 + attempt * 0.05, 1),
    max_tokens: 650,
    response_format: { type: "json_object" },
  });

  try {
    return JSON.parse(completion.choices[0]?.message?.content || "{}") as DailyBriefStory;
  } catch {
    return defaultDailyBrief(profile).bedtimeStory;
  }
}

export async function regenerateLanguage(
  profile: BriefProfile,
  memories: BriefMemory[],
  current?: DailyBriefDevelopment,
  planContext?: TodayPlanContext,
  attempt = 0
): Promise<DailyBriefDevelopment> {
  const context = planContext?.weightedContext ?? buildDailyBriefContext(profile, memories, []);
  const focusLock = planContext ? `\n${rotateFocusLock(planContext)}\nDo NOT change todayFocus or weeklyFocus.` : "";
  const avoid = current ? `\nDo NOT repeat: ${current.tryToday}` : "";
  const variation =
    attempt > 0
      ? `\nCRITICAL: Previous suggestion was too similar. Pick different words and a different mini-game (attempt ${attempt + 1}).`
      : "";

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: `Generate ONE language/speech development focus as JSON: { "domain": "Language", "icon": "💬", "insight": "Many children around this age...", "tryToday": "practical words/phrases or game", "reason": "Recommended because..." }. Also suitable for languageSection words and miniGame. Must be clearly different from the current suggestion. ${BRIEF_TONE_RULES}${focusLock}${avoid}${variation}`,
      },
      { role: "user", content: context },
    ],
    temperature: Math.min(0.88 + attempt * 0.06, 1),
    max_tokens: 320,
    response_format: { type: "json_object" },
  });

  try {
    return JSON.parse(completion.choices[0]?.message?.content || "{}") as DailyBriefDevelopment;
  } catch {
    const fallback = defaultDailyBrief(profile).development[0];
    return fallback;
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

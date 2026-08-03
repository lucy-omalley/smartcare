import type {
  DailyBriefDevelopment,
  DailyBriefPlay,
  DailyBriefRecipe,
  DailyBriefStory,
} from "@/types/daily-brief";
import type { BriefProfile } from "@/lib/daily-brief-context";

function normalizeKey(value: string | undefined | null): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function isSameRecipe(a: DailyBriefRecipe, b: DailyBriefRecipe): boolean {
  return (
    normalizeKey(a.subtitle) === normalizeKey(b.subtitle) ||
    (normalizeKey(a.title) === normalizeKey(b.title) &&
      normalizeKey(a.whyThisMeal) === normalizeKey(b.whyThisMeal))
  );
}

export function isSamePlay(a: DailyBriefPlay, b: DailyBriefPlay): boolean {
  return (
    normalizeKey(a.title) === normalizeKey(b.title) ||
    normalizeKey(a.instructions.join(" ")) === normalizeKey(b.instructions.join(" "))
  );
}

export function isSameStory(a: DailyBriefStory, b: DailyBriefStory): boolean {
  return (
    normalizeKey(a.title) === normalizeKey(b.title) ||
    normalizeKey(a.story).slice(0, 120) === normalizeKey(b.story).slice(0, 120)
  );
}

export function isSameLanguage(a: DailyBriefDevelopment, b: DailyBriefDevelopment): boolean {
  return (
    normalizeKey(a.tryToday) === normalizeKey(b.tryToday) &&
    normalizeKey(a.insight) === normalizeKey(b.insight)
  );
}

export function normalizeRotatedRecipe(
  raw: Partial<DailyBriefRecipe>,
  fallback: DailyBriefRecipe
): DailyBriefRecipe {
  const subtitle = raw.subtitle?.trim() || raw.title?.trim() || fallback.subtitle;
  const title = raw.title?.trim() || subtitle;

  return {
    ...fallback,
    ...raw,
    title,
    subtitle,
    prepTimeMinutes: raw.prepTimeMinutes ?? fallback.prepTimeMinutes,
    whyThisMeal: raw.whyThisMeal?.trim() || fallback.whyThisMeal,
    ingredients: raw.ingredients?.length ? raw.ingredients : fallback.ingredients,
    steps: raw.steps?.length ? raw.steps : fallback.steps,
    imageData: undefined,
    sampleLinks: undefined,
    fromFridge: false,
  };
}

export function normalizeRotatedPlay(raw: Partial<DailyBriefPlay>, fallback: DailyBriefPlay): DailyBriefPlay {
  return {
    ...fallback,
    ...raw,
    title: raw.title?.trim() || fallback.title,
    materials: raw.materials?.length ? raw.materials : fallback.materials,
    instructions: raw.instructions?.length ? raw.instructions : fallback.instructions,
    skillsDeveloped: raw.skillsDeveloped?.length ? raw.skillsDeveloped : fallback.skillsDeveloped,
    durationMinutes: raw.durationMinutes ?? fallback.durationMinutes,
    indoorOutdoor: raw.indoorOutdoor ?? fallback.indoorOutdoor,
    ageRecommendation: raw.ageRecommendation ?? fallback.ageRecommendation,
    reason: raw.reason?.trim() || fallback.reason,
    imageData: undefined,
  };
}

export function normalizeRotatedStory(raw: Partial<DailyBriefStory>, fallback: DailyBriefStory): DailyBriefStory {
  return {
    ...fallback,
    ...raw,
    title: raw.title?.trim() || fallback.title,
    story: raw.story?.trim() || fallback.story,
    theme: raw.theme?.trim() || fallback.theme,
    moral: raw.moral?.trim() || fallback.moral,
    reason: raw.reason?.trim() || fallback.reason,
    ageSuitability: raw.ageSuitability ?? fallback.ageSuitability,
    lengthMinutes: raw.lengthMinutes ?? fallback.lengthMinutes,
    illustrationData: undefined,
  };
}

export function normalizeRotatedLanguage(
  raw: Partial<DailyBriefDevelopment>,
  fallback: DailyBriefDevelopment
): DailyBriefDevelopment {
  return {
    ...fallback,
    ...raw,
    domain: raw.domain?.trim() || fallback.domain || "Language",
    icon: raw.icon ?? fallback.icon ?? "💬",
    insight: raw.insight?.trim() || fallback.insight,
    tryToday: raw.tryToday?.trim() || fallback.tryToday,
    reason: raw.reason?.trim() || fallback.reason,
  };
}

const RECIPE_ALTERNATES: Omit<DailyBriefRecipe, "imageData" | "sampleLinks" | "fromFridge">[] = [
  {
    title: "Today's Healthy Lunch",
    subtitle: "Cheesy Rice & Pea Bowl",
    prepTimeMinutes: 15,
    whyThisMeal: "Recommended because soft rice and cheese are comforting for many young eaters.",
    ingredients: ["Cooked rice", "Peas", "Grated cheese", "Butter", "Milk"],
    steps: ["Warm rice with a splash of milk.", "Stir in peas until heated.", "Top with cheese and serve."],
  },
  {
    title: "Today's Healthy Lunch",
    subtitle: "Mini Veggie Frittata",
    prepTimeMinutes: 20,
    whyThisMeal: "Recommended because bite-sized egg cups are easy to pick up and protein-rich.",
    ingredients: ["Eggs", "Spinach", "Cherry tomatoes", "Cheese", "Olive oil"],
    steps: ["Whisk eggs.", "Add chopped veg and cheese.", "Bake in muffin tins until set."],
  },
  {
    title: "Today's Healthy Lunch",
    subtitle: "Sweet Potato Mash Bites",
    prepTimeMinutes: 25,
    whyThisMeal: "Recommended because naturally sweet potato is often accepted by picky eaters.",
    ingredients: ["Sweet potato", "Olive oil", "Cinnamon", "Greek yogurt"],
    steps: ["Roast cubed sweet potato.", "Mash with yogurt.", "Serve warm as soft bites."],
  },
] ;

const PLAY_ALTERNATES: Omit<DailyBriefPlay, "imageData">[] = [
  {
    title: "Indoor Obstacle Trail",
    materials: ["Cushions", "Tape or string", "A small toy"],
    instructions: ["Lay out cushions to step over.", "Tape a line to balance along.", "Carry a toy to the finish."],
    skillsDeveloped: ["Balance", "Planning", "Gross motor"],
    durationMinutes: 15,
    indoorOutdoor: "indoor" as const,
    ageRecommendation: "2-5 years",
    reason: "Recommended because movement games burn energy and build coordination indoors.",
  },
  {
    title: "Sound Matching Game",
    materials: ["Two containers", "Rice or pasta", "Small toys"],
    instructions: ["Hide matching pairs in shakers.", "Shake and listen.", "Find the matching sounds together."],
    skillsDeveloped: ["Listening", "Memory", "Turn-taking"],
    durationMinutes: 15,
    indoorOutdoor: "indoor" as const,
    ageRecommendation: "2-5 years",
    reason: "Recommended because listening games support language and focus in a playful way.",
  },
  {
    title: "Sticker Story Path",
    materials: ["Paper", "Stickers", "Crayons"],
    instructions: ["Draw a simple path on paper.", "Place stickers as story stops.", "Tell a story at each stop."],
    skillsDeveloped: ["Language", "Creativity", "Fine motor"],
    durationMinutes: 20,
    indoorOutdoor: "indoor" as const,
    ageRecommendation: "2-5 years",
    reason: "Recommended because storytelling with stickers makes language practice feel like play.",
  },
] ;

function storyAlternates(profile: BriefProfile): Omit<DailyBriefStory, "illustrationData">[] {
  const child = profile.childNickname || "your little one";
  return [
    {
      title: `${child} and the Friendly Cloud`,
      theme: "Friendship",
      reason: `Recommended because a gentle cloud adventure helps ${child} wind down with warmth.`,
      ageSuitability: profile.childAge ?? "2-5 years",
      story: `High above the rooftops, ${child} met a shy cloud who wanted to make friends. ${child} waved, shared a song, and soon the cloud floated down to play. Together they painted soft shapes in the sky until it was time to rest. Goodnight, ${child}.`,
      lengthMinutes: 4,
      moral: "Friendship begins with a small hello.",
    },
    {
      title: `${child}'s Garden Discovery`,
      theme: "Curiosity",
      reason: `Recommended because a calm nature story suits a peaceful bedtime for ${child}.`,
      ageSuitability: profile.childAge ?? "2-5 years",
      story: `${child} found a tiny seed in the garden and wondered what it might become. Each day they checked with patience until a bright flower opened. ${child} smiled, proud of waiting and caring. The garden whispered goodnight.`,
      lengthMinutes: 4,
      moral: "Good things grow with patience.",
    },
    {
      title: `${child} Saves the Rainbow`,
      theme: "Kindness",
      reason: `Recommended because a colourful, gentle quest keeps bedtime engaging for ${child}.`,
      ageSuitability: profile.childAge ?? "2-5 years",
      story: `When colours started fading from the sky, ${child} set off with a pocket of kindness. Every helpful act brought back a stripe of the rainbow. By bedtime, the sky glowed again — and so did ${child}'s heart.`,
      lengthMinutes: 5,
      moral: "Small acts of kindness make the world brighter.",
    },
  ];
}

function pickAlternate<T extends { title?: string; subtitle?: string }>(
  options: readonly T[],
  current: T,
  key: (item: T) => string
): T {
  const currentKey = normalizeKey(key(current));
  const alternate = options.find((item) => normalizeKey(key(item)) !== currentKey);
  return alternate ?? options[0];
}

export function pickAlternateRecipe(_profile: BriefProfile, current: DailyBriefRecipe): DailyBriefRecipe {
  const base = pickAlternate(RECIPE_ALTERNATES, current, (item) => item.subtitle);
  return normalizeRotatedRecipe(base, current);
}

export function pickAlternatePlay(_profile: BriefProfile, current: DailyBriefPlay): DailyBriefPlay {
  const base = pickAlternate(PLAY_ALTERNATES, current, (item) => item.title);
  return normalizeRotatedPlay(base, current);
}

export function pickAlternateStory(profile: BriefProfile, current: DailyBriefStory): DailyBriefStory {
  const options = storyAlternates(profile);
  const base = pickAlternate(options, current, (item) => item.title);
  return normalizeRotatedStory(base, current);
}

export function rotateVariationHint(attempt: number): string {
  if (attempt <= 0) return "";
  return `\nCRITICAL: The last suggestion was too similar. Attempt ${attempt + 1} — choose a completely different theme, format, and main idea. Do not reuse the same title, ingredients, or plot beats.`;
}

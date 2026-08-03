import type {
  DailyBriefContent,
  DailyBriefDevelopment,
  DailyBriefPlay,
  DailyBriefRecipe,
  DailyBriefStory,
} from "@/types/daily-brief";
import type { BriefProfile } from "@/lib/daily-brief-context";

export type RotateSection = "recipe" | "play" | "story" | "language";

function normalizeKey(value: string | undefined | null): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function sectionSnapshot(
  brief: DailyBriefContent,
  section: RotateSection
): string {
  if (section === "recipe") return brief.recipe.subtitle;
  if (section === "play") return brief.play.title;
  if (section === "story") return brief.bedtimeStory.title;
  const language =
    brief.development.find((d) => /language|speech/i.test(d.domain)) ??
    brief.development[0];
  return language?.tryToday ?? brief.languageSection?.miniGame ?? "";
}

export function getRotationCount(content: DailyBriefContent, section: RotateSection): number {
  return content._rotationCounts?.[section] ?? 0;
}

export function withRotationCount(
  content: DailyBriefContent,
  section: RotateSection
): DailyBriefContent {
  const current = getRotationCount(content, section);
  return {
    ...content,
    _rotationCounts: {
      ...content._rotationCounts,
      [section]: current + 1,
    },
  };
}

/** Merge a rotated section into the current brief without dropping other cards. */
export function applyRotatedSection(
  current: DailyBriefContent,
  updated: DailyBriefContent,
  section: RotateSection
): DailyBriefContent {
  const merged: DailyBriefContent = {
    ...current,
    weeklyFocus: updated.weeklyFocus ?? current.weeklyFocus,
    todayFocus: updated.todayFocus ?? current.todayFocus,
    childAgeDisplay: updated.childAgeDisplay || current.childAgeDisplay,
    greeting: updated.greeting || current.greeting,
    _rotationCounts: updated._rotationCounts ?? current._rotationCounts,
  };

  if (section === "recipe" && updated.recipe?.subtitle) {
    merged.recipe = updated.recipe;
  } else {
    merged.recipe = current.recipe;
  }

  if (section === "play" && updated.play?.title) {
    merged.play = updated.play;
  } else {
    merged.play = current.play;
  }

  if (section === "story" && updated.bedtimeStory?.title) {
    merged.bedtimeStory = updated.bedtimeStory;
  } else {
    merged.bedtimeStory = current.bedtimeStory;
  }

  if (section === "language") {
    merged.development = updated.development?.length ? updated.development : current.development;
    merged.languageSection = updated.languageSection ?? current.languageSection;
  } else {
    merged.development = current.development;
    merged.languageSection = current.languageSection ?? updated.languageSection;
  }

  merged.tip = updated.tip ?? current.tip;
  merged.encouragement = updated.encouragement ?? current.encouragement;
  merged.milestone = updated.milestone ?? current.milestone;
  merged.parentTip = updated.parentTip ?? current.parentTip;

  return merged;
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

function hasNewRecipeContent(raw: Partial<DailyBriefRecipe>): boolean {
  return Boolean(raw.subtitle?.trim() || raw.title?.trim());
}

function hasNewPlayContent(raw: Partial<DailyBriefPlay>): boolean {
  return Boolean(raw.title?.trim());
}

function hasNewStoryContent(raw: Partial<DailyBriefStory>): boolean {
  return Boolean(raw.title?.trim() && raw.story?.trim());
}

function hasNewLanguageContent(raw: Partial<DailyBriefDevelopment>): boolean {
  return Boolean(raw.tryToday?.trim());
}

export function normalizeRotatedRecipe(
  raw: Partial<DailyBriefRecipe>,
  fallback: DailyBriefRecipe
): DailyBriefRecipe {
  if (!hasNewRecipeContent(raw)) {
    return fallback;
  }

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
  if (!hasNewPlayContent(raw)) {
    return fallback;
  }

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
  if (!hasNewStoryContent(raw)) {
    return fallback;
  }

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
  if (!hasNewLanguageContent(raw)) {
    return fallback;
  }

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
  {
    title: "Today's Healthy Lunch",
    subtitle: "Avocado Toast Fingers",
    prepTimeMinutes: 10,
    whyThisMeal: "Recommended because soft finger foods support self-feeding confidence.",
    ingredients: ["Wholegrain bread", "Ripe avocado", "Lemon juice", "Pinch of salt"],
    steps: ["Toast bread and cut into fingers.", "Mash avocado with lemon.", "Spread lightly and serve."],
  },
  {
    title: "Today's Healthy Lunch",
    subtitle: "Yoghurt Berry Parfait",
    prepTimeMinutes: 8,
    whyThisMeal: "Recommended because cool, colourful layers feel like a treat while staying balanced.",
    ingredients: ["Greek yogurt", "Mixed berries", "Granola", "Honey"],
    steps: ["Layer yogurt and berries in a cup.", "Add a little granola on top.", "Serve immediately."],
  },
];

const PLAY_ALTERNATES: Omit<DailyBriefPlay, "imageData">[] = [
  {
    title: "Indoor Obstacle Trail",
    materials: ["Cushions", "Tape or string", "A small toy"],
    instructions: ["Lay out cushions to step over.", "Tape a line to balance along.", "Carry a toy to the finish."],
    skillsDeveloped: ["Balance", "Planning", "Gross motor"],
    durationMinutes: 15,
    indoorOutdoor: "indoor",
    ageRecommendation: "2-5 years",
    reason: "Recommended because movement games burn energy and build coordination indoors.",
  },
  {
    title: "Sound Matching Game",
    materials: ["Two containers", "Rice or pasta", "Small toys"],
    instructions: ["Hide matching pairs in shakers.", "Shake and listen.", "Find the matching sounds together."],
    skillsDeveloped: ["Listening", "Memory", "Turn-taking"],
    durationMinutes: 15,
    indoorOutdoor: "indoor",
    ageRecommendation: "2-5 years",
    reason: "Recommended because listening games support language and focus in a playful way.",
  },
  {
    title: "Sticker Story Path",
    materials: ["Paper", "Stickers", "Crayons"],
    instructions: ["Draw a simple path on paper.", "Place stickers as story stops.", "Tell a story at each stop."],
    skillsDeveloped: ["Language", "Creativity", "Fine motor"],
    durationMinutes: 20,
    indoorOutdoor: "indoor",
    ageRecommendation: "2-5 years",
    reason: "Recommended because storytelling with stickers makes language practice feel like play.",
  },
  {
    title: "Kitchen Band Jam",
    materials: ["Wooden spoons", "Pots", "Plastic containers"],
    instructions: ["Set out safe pots and spoons.", "Tap out a simple rhythm.", "Take turns being the conductor."],
    skillsDeveloped: ["Rhythm", "Listening", "Imagination"],
    durationMinutes: 15,
    indoorOutdoor: "indoor",
    ageRecommendation: "2-5 years",
    reason: "Recommended because music play supports listening and joyful connection.",
  },
  {
    title: "Build a Blanket Fort",
    materials: ["Blankets", "Chairs", "Clothes pegs"],
    instructions: ["Drape blankets over chairs.", "Add cushions inside.", "Read or play pretend in the fort."],
    skillsDeveloped: ["Problem solving", "Cooperation", "Imaginative play"],
    durationMinutes: 25,
    indoorOutdoor: "indoor",
    ageRecommendation: "2-5 years",
    reason: "Recommended because cosy pretend spaces invite calm, creative play.",
  },
];

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
    {
      title: `${child} and the Sleepy Train`,
      theme: "Routine",
      reason: `Recommended because a slow bedtime journey helps ${child} settle into sleep.`,
      ageSuitability: profile.childAge ?? "2-5 years",
      story: `${child} climbed aboard a little train that chuffed softly through quiet hills. Each station was a yawn and a cuddle. By the last stop, the stars were out and ${child} was ready to dream.`,
      lengthMinutes: 4,
      moral: "Gentle routines help us rest.",
    },
    {
      title: `${child}'s Moonlight Picnic`,
      theme: "Wonder",
      reason: `Recommended because a peaceful moonlit tale creates a soothing end to the day for ${child}.`,
      ageSuitability: profile.childAge ?? "2-5 years",
      story: `${child} spread a blanket under the moon and shared crumbs with friendly moths. The night smelled of grass and stories. When eyelids grew heavy, the moon tucked a silver blanket over them. Sleep well, ${child}.`,
      lengthMinutes: 4,
      moral: "Quiet moments can be magical.",
    },
  ];
}

function pickFromPool<T extends { title?: string; subtitle?: string }>(
  options: T[],
  current: T,
  key: (item: T) => string,
  rotationIndex: number
): T {
  const currentKey = normalizeKey(key(current));
  const different = options.filter((item) => normalizeKey(key(item)) !== currentKey);
  const pool = different.length > 0 ? different : options;
  return pool[rotationIndex % pool.length];
}

export function pickAlternateRecipe(
  _profile: BriefProfile,
  current: DailyBriefRecipe,
  rotationIndex: number
): DailyBriefRecipe {
  const base = pickFromPool(RECIPE_ALTERNATES, current, (item) => item.subtitle, rotationIndex);
  return normalizeRotatedRecipe(base, current);
}

export function pickAlternatePlay(
  _profile: BriefProfile,
  current: DailyBriefPlay,
  rotationIndex: number
): DailyBriefPlay {
  const base = pickFromPool(PLAY_ALTERNATES, current, (item) => item.title, rotationIndex);
  return normalizeRotatedPlay(base, current);
}

export function pickAlternateStory(
  profile: BriefProfile,
  current: DailyBriefStory,
  rotationIndex: number
): DailyBriefStory {
  const options = storyAlternates(profile);
  const base = pickFromPool(options, current, (item) => item.title, rotationIndex);
  return normalizeRotatedStory(base, current);
}

export function pickAlternateLanguage(
  current: DailyBriefDevelopment,
  rotationIndex: number
): DailyBriefDevelopment {
  const options: DailyBriefDevelopment[] = [
    {
      domain: "Language",
      icon: "💬",
      insight: "Many children around this age enjoy naming objects during everyday routines.",
      tryToday: "Point and name three items at bath time: towel, duck, soap.",
      reason: "Recommended because labelling familiar objects builds everyday vocabulary.",
    },
    {
      domain: "Language",
      icon: "💬",
      insight: "Many children around this age begin joining two words together.",
      tryToday: "Model short phrases like 'more milk' and 'big truck' during play.",
      reason: "Recommended because short phrases support early sentence building.",
    },
    {
      domain: "Language",
      icon: "💬",
      insight: "Many children around this age love silly sounds and repetition.",
      tryToday: "Play an animal sounds game: you moo, they copy, then swap roles.",
      reason: "Recommended because copying sounds strengthens speech muscles and confidence.",
    },
    {
      domain: "Language",
      icon: "💬",
      insight: "Many children around this age respond well to choice questions.",
      tryToday: "Offer two choices all day: 'Apple or banana?' and wait for a word or gesture.",
      reason: "Recommended because choices invite communication without pressure.",
    },
  ];
  const currentKey = normalizeKey(current.tryToday);
  const different = options.filter((item) => normalizeKey(item.tryToday) !== currentKey);
  const pool = different.length > 0 ? different : options;
  const base = pool[rotationIndex % pool.length];
  return normalizeRotatedLanguage(base, current);
}

export function rotateVariationHint(attempt: number): string {
  if (attempt <= 0) return "";
  return `\nCRITICAL: Attempt ${attempt + 1} — choose a completely different theme, format, and main idea. Random token: ${Date.now()}-${attempt}.`;
}

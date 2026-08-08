import { PrismaClient, KnowledgeTipCategory } from "@prisma/client";

const prisma = new PrismaClient();

/** Seed structured knowledge — AI selects from this, never invents from scratch */
export async function seedKnowledgeBase() {
  const recipes = [
    {
      slug: "cheesy-rice-pea-bowl",
      title: "Today's Healthy Lunch",
      subtitle: "Cheesy Rice & Pea Bowl",
      minAgeMonths: 12,
      maxAgeMonths: 72,
      prepTimeMinutes: 15,
      ingredients: ["Cooked rice", "Peas", "Grated cheese", "Butter", "Milk"],
      steps: ["Warm rice with milk.", "Stir in peas.", "Top with cheese."],
      detailedSteps: [
        "Measure leftover rice into a pan.",
        "Add splash of milk and butter on low heat.",
        "Stir until creamy.",
        "Add peas until warmed.",
        "Remove from heat, sprinkle cheese.",
        "Let child stir cheese in.",
        "Check temperature before serving.",
      ],
      nutritionTags: ["Energy", "Vegetables"],
      whyThisMeal: "Recommended because soft rice and cheese are comforting for young eaters.",
      healthyTip: "Let your child stir the cheese in.",
      tags: ["comfort", "vegetarian", "quick"],
    },
    {
      slug: "veggie-pasta",
      title: "Today's Healthy Lunch",
      subtitle: "Simple Veggie Pasta",
      minAgeMonths: 18,
      maxAgeMonths: 72,
      prepTimeMinutes: 20,
      ingredients: ["Pasta", "Cherry tomatoes", "Peas", "Olive oil", "Cheese"],
      steps: ["Cook pasta.", "Sauté veg.", "Mix and serve."],
      detailedSteps: [
        "Boil pasta until soft.",
        "Halve tomatoes and warm peas in oil.",
        "Drain pasta, toss with vegetables.",
        "Add olive oil and cheese.",
        "Serve at safe temperature.",
      ],
      nutritionTags: ["Vegetables", "Energy"],
      whyThisMeal: "Recommended because familiar pasta with hidden veg suits picky eaters.",
      tags: ["pasta", "vegetarian"],
    },
    {
      slug: "banana-pancake-bites",
      title: "Today's Healthy Lunch",
      subtitle: "Banana Oat Pancake Bites",
      minAgeMonths: 12,
      maxAgeMonths: 60,
      prepTimeMinutes: 15,
      ingredients: ["Banana", "Oats", "Egg", "Cinnamon"],
      steps: ["Mash and mix.", "Cook spoonfuls.", "Serve warm."],
      detailedSteps: [
        "Mash ripe banana in a bowl.",
        "Mix oats, egg, and cinnamon.",
        "Heat buttered pan on medium-low.",
        "Cook small rounds 2 min per side.",
        "Cool slightly before serving.",
      ],
      nutritionTags: ["Fruit", "Protein"],
      tags: ["breakfast", "finger-food"],
    },
  ];

  for (const r of recipes) {
    await prisma.knowledgeRecipe.upsert({
      where: { slug: r.slug },
      create: r,
      update: r,
    });
  }

  const activities = [
    {
      slug: "colour-treasure-hunt",
      title: "Colour Treasure Hunt",
      minAgeMonths: 24,
      maxAgeMonths: 60,
      indoorOutdoor: "indoor",
      rainyDay: true,
      sunnyDay: true,
      durationMinutes: 20,
      materials: ["Coloured toys or paper", "Basket"],
      instructions: ["Hide colourful items.", "Name a colour to find.", "Celebrate discoveries."],
      detailedInstructions: [
        "Pick 5–8 items in different colours.",
        "Hide at eye level in one room.",
        "Ask 'Can you find something red?'",
        "Wait and praise each find.",
        "Place treasures in the basket together.",
        "Play again with new colours.",
      ],
      skillsDeveloped: ["Colour recognition", "Language", "Gross motor"],
      tags: ["indoor", "language", "cars"],
      reason: "Recommended because colour games build vocabulary through play.",
    },
    {
      slug: "nature-colour-walk",
      title: "Nature Colour Walk",
      minAgeMonths: 24,
      maxAgeMonths: 72,
      indoorOutdoor: "outdoor",
      rainyDay: false,
      sunnyDay: true,
      durationMinutes: 25,
      materials: ["Bag or basket"],
      instructions: ["Walk outside.", "Find red, green, brown items.", "Talk about textures."],
      detailedInstructions: [
        "Choose a short safe route.",
        "Collect one item per colour.",
        "Name textures: smooth, rough.",
        "Display finds at home.",
      ],
      skillsDeveloped: ["Observation", "Language", "Gross motor"],
      tags: ["outdoor", "animals", "nature"],
      reason: "Recommended because outdoor exploration builds curiosity.",
    },
    {
      slug: "obstacle-adventure",
      title: "Indoor Obstacle Adventure",
      minAgeMonths: 24,
      maxAgeMonths: 60,
      indoorOutdoor: "indoor",
      rainyDay: true,
      sunnyDay: false,
      durationMinutes: 20,
      materials: ["Cushions", "Masking tape", "Small toy"],
      instructions: ["Build a path.", "Balance on tape line.", "Carry toy to finish."],
      detailedInstructions: [
        "Lay cushions to step over.",
        "Tape a zigzag line.",
        "Demonstrate the course.",
        "Time each lap together.",
      ],
      skillsDeveloped: ["Balance", "Planning", "Gross motor"],
      tags: ["indoor", "active", "cars"],
      reason: "Recommended because movement games burn energy on rainy days.",
    },
  ];

  for (const a of activities) {
    await prisma.knowledgeActivity.upsert({
      where: { slug: a.slug },
      create: a,
      update: a,
    });
  }

  const stories = [
    {
      slug: "friendly-cloud",
      titleTemplate: "{child} and the Friendly Cloud",
      theme: "Friendship",
      minAgeMonths: 24,
      maxAgeMonths: 72,
      storyTemplate:
        "One afternoon, {child} met a shy cloud shaped like a bunny. They whispered hello and played shadow shapes until the sun turned golden. Goodnight, {child}.",
      moral: "Friendship begins with a kind hello.",
      lengthMinutes: 4,
      tags: ["bedtime", "gentle"],
      reason: "Recommended because a calm sky story helps wind down.",
    },
    {
      slug: "garden-discovery",
      titleTemplate: "{child}'s Garden Discovery",
      theme: "Patience",
      minAgeMonths: 24,
      maxAgeMonths: 60,
      storyTemplate:
        "{child} planted a seed and checked each day until a flower opened. 'We waited together,' they smiled. Goodnight, {child}.",
      moral: "Beautiful things grow with patience.",
      tags: ["nature", "bedtime"],
    },
  ];

  for (const s of stories) {
    await prisma.knowledgeStory.upsert({
      where: { slug: s.slug },
      create: s,
      update: s,
    });
  }

  const tips = [
    {
      slug: "speech-bath-naming",
      category: KnowledgeTipCategory.SPEECH,
      minAgeMonths: 12,
      maxAgeMonths: 48,
      title: "Name objects at bath time",
      content: "Many children around this age learn words fastest during familiar routines.",
      tryToday: "Point and name five items: towel, duck, soap, cup, water.",
      tags: ["speech", "routine"],
    },
    {
      slug: "sleep-wind-down",
      category: KnowledgeTipCategory.SLEEP,
      minAgeMonths: 12,
      maxAgeMonths: 72,
      title: "Predictable bedtime sequence",
      content: "Consistent cues help the body prepare for sleep.",
      tryToday: "Use the same three steps each night: bath, book, bed.",
      tags: ["sleep"],
    },
    {
      slug: "eating-no-pressure",
      category: KnowledgeTipCategory.EATING,
      minAgeMonths: 12,
      maxAgeMonths: 72,
      title: "Offer without pressure",
      content: "Repeated neutral exposure helps acceptance more than forcing bites.",
      tryToday: "Place one new food on the plate alongside a safe favourite.",
      tags: ["eating"],
    },
  ];

  for (const t of tips) {
    await prisma.knowledgeTip.upsert({
      where: { slug: t.slug },
      create: t,
      update: t,
    });
  }

  const milestones = [
    {
      slug: "two-word-phrases",
      minAgeMonths: 18,
      maxAgeMonths: 36,
      category: "Speech",
      title: "Joining two words together",
      description: "Many children begin combining words like 'more milk' or 'big truck'.",
      whyItMatters: "Two-word phrases bridge single words and full sentences.",
      parentTip: "Model short phrases during play without asking for repetition.",
      tags: ["speech"],
    },
  ];

  for (const m of milestones) {
    await prisma.knowledgeMilestone.upsert({
      where: { slug: m.slug },
      create: m,
      update: m,
    });
  }

  const books = [
    {
      slug: "very-hungry-caterpillar",
      title: "The Very Hungry Caterpillar",
      author: "Eric Carle",
      minAgeMonths: 12,
      maxAgeMonths: 48,
      language: "English",
      theme: "Nature",
      summary: "A caterpillar eats through the week and transforms — great for counting and days of the week.",
      tags: ["classic", "nature"],
    },
  ];

  for (const b of books) {
    await prisma.knowledgeBook.upsert({
      where: { slug: b.slug },
      create: b,
      update: b,
    });
  }

  console.log("Knowledge base seeded.");
}

if (require.main === module) {
  seedKnowledgeBase()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}

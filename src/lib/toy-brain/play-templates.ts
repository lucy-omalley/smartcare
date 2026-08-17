import type { ToyCategory } from "@prisma/client";
import type { ToyPlayActivity } from "@/types/toy-brain";

type TemplateSeed = Omit<ToyPlayActivity, "id">;

function act(id: string, seed: TemplateSeed): ToyPlayActivity {
  return { id, ...seed };
}

function replaceToy(text: string, toyName: string): string {
  return text.replace(/\{toy\}/g, toyName);
}

function mapTemplates(seeds: TemplateSeed[], toyName: string, prefix: string): ToyPlayActivity[] {
  return seeds.map((s, i) => ({
    ...s,
    id: `${prefix}-${i}`,
    title: replaceToy(s.title, toyName),
    materials: s.materials.map((m) => replaceToy(m, toyName)),
    instructions: s.instructions.map((m) => replaceToy(m, toyName)),
    parentTips: s.parentTips.map((m) => replaceToy(m, toyName)),
    questionsToAsk: s.questionsToAsk.map((m) => replaceToy(m, toyName)),
    learningOutcomes: s.learningOutcomes.map((m) => replaceToy(m, toyName)),
  }));
}

const CONSTRUCTION_TEMPLATES: TemplateSeed[] = [
  {
    title: "{toy} Fire Station Rescue",
    durationMinutes: 20,
    difficulty: "easy",
    indoorOutdoor: "indoor",
    messLevel: "low",
    prepMinutes: 3,
    materials: ["{toy}", "Toy cars", "Paper", "Crayons"],
    instructions: [
      "Build a fire station together using {toy}.",
      "Draw a road on paper and place toy cars nearby.",
      "Take turns being the firefighter rescuing a teddy bear.",
      "Celebrate each rescue with a cheer!",
    ],
    parentTips: ["Let your child lead the build — resist fixing their design."],
    questionsToAsk: ["Where should the fire station door go?", "Who needs rescuing today?"],
    skills: ["creativity", "problem_solving", "language"],
    learningOutcomes: ["Imaginative storytelling", "Fine motor through building", "Turn-taking in rescue missions"],
    cleanupTips: ["Snap pieces into a tray — make it a sorting game."],
    safetyNotes: ["Check for small pieces if younger siblings are nearby."],
    heroEmoji: "🚒",
    filters: ["20min", "indoor", "quick_setup", "language"],
  },
  {
    title: "Tallest {toy} Tower Challenge",
    durationMinutes: 10,
    difficulty: "easy",
    indoorOutdoor: "indoor",
    messLevel: "mess_free",
    prepMinutes: 1,
    materials: ["{toy}"],
    instructions: [
      "Challenge your child to build the tallest tower.",
      "Count blocks together as you stack.",
      "When it falls, laugh and try a wider base.",
    ],
    parentTips: ["Celebrate effort, not height — falling towers teach physics!"],
    questionsToAsk: ["What shape makes it steadier?", "How many blocks high?"],
    skills: ["counting", "problem_solving", "fine_motor"],
    learningOutcomes: ["Early maths through counting", "Balance and cause-effect"],
    cleanupTips: ["Race to put pieces in a box by colour."],
    safetyNotes: [],
    heroEmoji: "🏗️",
    filters: ["10min", "indoor", "mess_free", "quick_setup", "stem"],
  },
  {
    title: "{toy} Colour Sorting Factory",
    durationMinutes: 15,
    difficulty: "easy",
    indoorOutdoor: "indoor",
    messLevel: "mess_free",
    prepMinutes: 2,
    materials: ["{toy}", "Bowls or paper plates"],
    instructions: [
      "Set out coloured bowls for sorting.",
      "Sort {toy} pieces by colour together.",
      "Build one small model from each colour group.",
    ],
    parentTips: ["Name colours aloud — great for vocabulary."],
    questionsToAsk: ["Can you find all the red ones?", "Which pile is biggest?"],
    skills: ["vocabulary", "counting", "executive_function"],
    learningOutcomes: ["Colour recognition", "Sorting and categorising"],
    cleanupTips: ["Sorting IS cleanup — win-win!"],
    safetyNotes: [],
    heroEmoji: "🎨",
    filters: ["15min", "indoor", "mess_free", "montessori", "language"],
  },
  {
    title: "Build-a-{toy} Zoo",
    durationMinutes: 25,
    difficulty: "medium",
    indoorOutdoor: "indoor",
    messLevel: "low",
    prepMinutes: 5,
    materials: ["{toy}", "Animal figures or drawings", "Blanket"],
    instructions: [
      "Use a blanket as the zoo floor.",
      "Build enclosures with {toy} for each animal.",
      "Give tours — your child is the zookeeper!",
    ],
    parentTips: ["Encourage animal sounds and names during the tour."],
    questionsToAsk: ["What does each animal eat?", "Which enclosure is biggest?"],
    skills: ["language", "creativity", "sharing"],
    learningOutcomes: ["Animal vocabulary", "Spatial planning", "Narrative skills"],
    cleanupTips: ["Animals go in one box, blocks in another."],
    safetyNotes: [],
    heroEmoji: "🦁",
    filters: ["20min", "30min", "indoor", "language", "rainy_day"],
  },
  {
    title: "{toy} Bridge for Cars",
    durationMinutes: 15,
    difficulty: "medium",
    indoorOutdoor: "indoor",
    messLevel: "mess_free",
    prepMinutes: 2,
    materials: ["{toy}", "Toy cars"],
    instructions: [
      "Build a bridge strong enough for toy cars to cross.",
      "Test with one car, then two.",
      "Improve the design if it collapses.",
    ],
    parentTips: ["Ask 'what could we change?' instead of showing the fix."],
    questionsToAsk: ["Is the bridge wide enough?", "What happens if we add more blocks underneath?"],
    skills: ["problem_solving", "fine_motor", "confidence"],
    learningOutcomes: ["Engineering thinking", "Persistence through trial and error"],
    cleanupTips: ["Drive cars into the garage (box) first."],
    safetyNotes: [],
    heroEmoji: "🌉",
    filters: ["15min", "indoor", "stem", "quick_setup"],
  },
  {
    title: "Bedtime {toy} Story Scene",
    durationMinutes: 10,
    difficulty: "easy",
    indoorOutdoor: "indoor",
    messLevel: "mess_free",
    prepMinutes: 2,
    materials: ["{toy}", "Torch (optional)"],
    instructions: [
      "Build a scene from today's story or imagination.",
      "Act out the story with the models.",
      "Dim lights and use a torch for bedtime magic.",
    ],
    parentTips: ["Calm voice and slow pace — perfect pre-bed wind-down."],
    questionsToAsk: ["What happens next in our story?", "How does the hero feel?"],
    skills: ["language", "emotional_regulation", "creativity"],
    learningOutcomes: ["Story sequencing", "Emotional vocabulary"],
    cleanupTips: ["Leave one small creation out as a 'night guard' if child wants."],
    safetyNotes: [],
    heroEmoji: "🌙",
    filters: ["10min", "indoor", "mess_free", "rainy_day", "language"],
  },
];

const VEHICLE_TEMPLATES: TemplateSeed[] = [
  {
    title: "{toy} Race Day",
    durationMinutes: 15,
    difficulty: "easy",
    indoorOutdoor: "either",
    messLevel: "mess_free",
    prepMinutes: 2,
    materials: ["{toy}", "Masking tape", "Finish line object"],
    instructions: [
      "Tape a race track on the floor.",
      "Line up {toy} at the start.",
      "Race! Count laps together.",
    ],
    parentTips: ["Model good sportsmanship when you lose."],
    questionsToAsk: ["Which car is fastest? Why?", "How many laps did we do?"],
    skills: ["gross_motor", "counting", "turn_taking"],
    learningOutcomes: ["Turn-taking", "Number counting in context"],
    cleanupTips: ["Peel tape together — fine motor bonus."],
    safetyNotes: ["Clear space for running if playing outdoors."],
    heroEmoji: "🏁",
    filters: ["15min", "outdoor", "quick_setup", "5min"],
  },
  {
    title: "{toy} Car Wash",
    durationMinutes: 20,
    difficulty: "easy",
    indoorOutdoor: "outdoor",
    messLevel: "medium",
    prepMinutes: 5,
    materials: ["{toy}", "Warm soapy water", "Cloth", "Towel"],
    instructions: [
      "Set up a car wash station outside or in the bath.",
      "Wash each {toy} vehicle with soapy water.",
      "Dry and polish — talk about real car washes.",
    ],
    parentTips: ["Great sensory play — expect splashes!"],
    questionsToAsk: ["Which part is dirtiest?", "What colour is this car?"],
    skills: ["fine_motor", "language", "responsibility"],
    learningOutcomes: ["Care for belongings", "Sensory exploration"],
    cleanupTips: ["Towel dry cars before storing."],
    safetyNotes: ["Supervise water play; non-slip surface."],
    heroEmoji: "🫧",
    filters: ["20min", "outdoor", "30min"],
  },
];

const CREATIVE_TEMPLATES: TemplateSeed[] = [
  {
    title: "{toy} Monster Creations",
    durationMinutes: 15,
    difficulty: "easy",
    indoorOutdoor: "indoor",
    messLevel: "medium",
    prepMinutes: 3,
    materials: ["{toy}", "Googly eyes (optional)", "Paper"],
    instructions: [
      "Sculpt silly monsters with {toy}.",
      "Give each monster a name and superpower.",
      "Draw homes for monsters on paper.",
    ],
    parentTips: ["No 'right' monster — praise unique ideas."],
    questionsToAsk: ["What sound does your monster make?", "Is it friendly or silly?"],
    skills: ["creativity", "language", "fine_motor"],
    learningOutcomes: ["Imaginative expression", "Vocabulary building"],
    cleanupTips: ["Roll scraps into a ball before storing."],
    safetyNotes: ["Ensure {toy} is non-toxic for your child's age."],
    heroEmoji: "👾",
    filters: ["15min", "indoor", "rainy_day", "language"],
  },
];

const PRETEND_TEMPLATES: TemplateSeed[] = [
  {
    title: "{toy} Restaurant",
    durationMinutes: 25,
    difficulty: "easy",
    indoorOutdoor: "indoor",
    messLevel: "low",
    prepMinutes: 5,
    materials: ["{toy}", "Play food or real snacks", "Notepad"],
    instructions: [
      "Set up a restaurant — child is chef or waiter.",
      "Take orders using {toy} as props.",
      "Serve pretend (or real) meals.",
    ],
    parentTips: ["Practice please/thank you naturally in role-play."],
    questionsToAsk: ["What's today's special?", "How much does it cost?"],
    skills: ["language", "social_skills", "counting"],
    learningOutcomes: ["Social scripts", "Early maths with pretend money"],
    cleanupTips: ["Busser game — clear table together."],
    safetyNotes: [],
    heroEmoji: "🍽️",
    filters: ["20min", "30min", "indoor", "language", "rainy_day"],
  },
];

const GENERIC_TEMPLATES: TemplateSeed[] = [
  {
    title: "Hide & Seek with {toy}",
    durationMinutes: 10,
    difficulty: "easy",
    indoorOutdoor: "indoor",
    messLevel: "mess_free",
    prepMinutes: 1,
    materials: ["{toy}"],
    instructions: [
      "Take turns hiding {toy} in the room.",
      "Give hot/cold clues.",
      "Celebrate when found!",
    ],
    parentTips: ["Use positional words: under, behind, beside."],
    questionsToAsk: ["Is it warm or cold?", "Where could it be next?"],
    skills: ["language", "problem_solving", "turn_taking"],
    learningOutcomes: ["Positional vocabulary", "Patience and turns"],
    cleanupTips: ["Already put away — it's found!"],
    safetyNotes: [],
    heroEmoji: "🔍",
    filters: ["10min", "5min", "indoor", "mess_free", "quick_setup"],
  },
  {
    title: "{toy} Story Starters",
    durationMinutes: 15,
    difficulty: "easy",
    indoorOutdoor: "indoor",
    messLevel: "mess_free",
    prepMinutes: 1,
    materials: ["{toy}"],
    instructions: [
      "Hold {toy} and start a story: 'One day...'",
      "Pass the toy — each person adds one sentence.",
      "Act out the ending together.",
    ],
    parentTips: ["Accept silly answers — that's creativity!"],
    questionsToAsk: ["What happens next?", "How did the story end?"],
    skills: ["language", "creativity", "confidence"],
    learningOutcomes: ["Narrative development", "Speaking confidence"],
    cleanupTips: [],
    safetyNotes: [],
    heroEmoji: "📖",
    filters: ["15min", "indoor", "mess_free", "language", "rainy_day"],
  },
  {
    title: "{toy} Obstacle Course",
    durationMinutes: 20,
    difficulty: "medium",
    indoorOutdoor: "either",
    messLevel: "low",
    prepMinutes: 5,
    materials: ["{toy}", "Cushions", "Chairs"],
    instructions: [
      "Set up a simple obstacle course.",
      "Carry {toy} through each station.",
      "Time optional — focus on fun!",
    ],
    parentTips: ["Great for burning energy before bath/bed."],
    questionsToAsk: ["Which part was trickiest?", "Can we go backwards?"],
    skills: ["gross_motor", "executive_function", "confidence"],
    learningOutcomes: ["Motor planning", "Following multi-step directions"],
    cleanupTips: ["Reset cushions as part of the game."],
    safetyNotes: ["Clear sharp corners; soft landings."],
    heroEmoji: "🏃",
    filters: ["20min", "outdoor", "30min"],
  },
  {
    title: "{toy} Counting Game",
    durationMinutes: 10,
    difficulty: "easy",
    indoorOutdoor: "indoor",
    messLevel: "mess_free",
    prepMinutes: 1,
    materials: ["{toy}"],
    instructions: [
      "Line up {toy} pieces and count together.",
      "Add one, take one away — explore numbers.",
      "Group into twos or threes if ready.",
    ],
    parentTips: ["Touch each item when counting — one-to-one correspondence."],
    questionsToAsk: ["How many altogether?", "What if we add one more?"],
    skills: ["counting", "fine_motor"],
    learningOutcomes: ["Early numeracy", "One-to-one counting"],
    cleanupTips: ["Count into the box: 1, 2, 3..."],
    safetyNotes: [],
    heroEmoji: "🔢",
    filters: ["10min", "5min", "indoor", "mess_free", "stem", "montessori"],
  },
  {
    title: "{toy} Pattern Play",
    durationMinutes: 15,
    difficulty: "medium",
    indoorOutdoor: "indoor",
    messLevel: "mess_free",
    prepMinutes: 2,
    materials: ["{toy}"],
    instructions: [
      "Make a simple pattern (big-small-big).",
      "Ask your child to continue it.",
      "Switch roles — they create the pattern.",
    ],
    parentTips: ["Start with two-step patterns before three."],
    questionsToAsk: ["What comes next?", "Can you make a harder pattern?"],
    skills: ["problem_solving", "executive_function"],
    learningOutcomes: ["Pattern recognition — foundation for maths"],
    cleanupTips: [],
    safetyNotes: [],
    heroEmoji: "🔁",
    filters: ["15min", "indoor", "mess_free", "stem", "montessori"],
  },
];

const CATEGORY_TEMPLATES: Partial<Record<ToyCategory, TemplateSeed[]>> = {
  LEGO: CONSTRUCTION_TEMPLATES,
  DUPLO: CONSTRUCTION_TEMPLATES,
  MAGNETIC_TILES: CONSTRUCTION_TEMPLATES,
  BUILDING_BLOCKS: CONSTRUCTION_TEMPLATES,
  TOY_CARS: VEHICLE_TEMPLATES,
  TRAIN_SETS: VEHICLE_TEMPLATES,
  PLAY_DOH: CREATIVE_TEMPLATES,
  ART_SUPPLIES: CREATIVE_TEMPLATES,
  KITCHEN_SETS: PRETEND_TEMPLATES,
  DOLLS: PRETEND_TEMPLATES,
  ANIMAL_FIGURES: PRETEND_TEMPLATES,
  PRETEND_PLAY: PRETEND_TEMPLATES,
};

/** Database-first play ideas — AI personalises on top for premium users */
export function getTemplateActivities(category: ToyCategory, toyName: string): ToyPlayActivity[] {
  const specific = CATEGORY_TEMPLATES[category] ?? [];
  const combined = [...specific, ...GENERIC_TEMPLATES];
  const unique = combined.slice(0, 10);
  return mapTemplates(unique, toyName, category.toLowerCase());
}

export function mergeActivities(
  templates: ToyPlayActivity[],
  aiActivities: ToyPlayActivity[],
  limit: number
): ToyPlayActivity[] {
  const seen = new Set<string>();
  const merged: ToyPlayActivity[] = [];
  for (const a of [...aiActivities, ...templates]) {
    const key = a.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(a);
    if (merged.length >= limit) break;
  }
  return merged;
}

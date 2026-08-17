import {
  Bot,
  Brain,
  Calendar,
  ChefHat,
  Gamepad2,
  Moon,
  Printer,
  Sparkles,
  Sun,
  Trophy,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export const V2_NAV = [
  { href: "#experiences", label: "Experiences" },
  { href: "#journey", label: "Your day" },
  { href: "#screenshots", label: "App preview" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
] as const;

export const HERO = {
  headline: "Your AI Family Companion",
  subheadline:
    "Helping busy parents plan, play, build routines and create magical bedtime moments.",
  description:
    "Everything personalised around your child. From today's activities to bedtime stories.",
  primaryCta: "Start Free",
  secondaryCta: "Watch 60 Second Demo",
  demoTarget: "#screenshots",
} as const;

export const TRUST_BADGES = [
  "Free to Start",
  "Multiple Child Profiles",
  "Designed for Children Aged 0–6",
  "Privacy First",
] as const;

export type FlowStep = { label: string; emoji?: string; accent?: string };

export type HeroExperienceV2 = {
  id: string;
  emoji: string;
  headline: string;
  title: string;
  description: string;
  flow: FlowStep[];
  benefits: readonly string[];
  cta: string;
  href: string;
  badge?: string;
  theme: "coral" | "sage" | "sky";
};

export const HERO_EXPERIENCES_V2: HeroExperienceV2[] = [
  {
    id: "toy-brain",
    emoji: "🧸",
    title: "AI Toy Brain",
    headline: "Snap a Toy.\nUnlock New Ways to Play.",
    description:
      "Take a photo of any toy. Parenfy recognises it and creates personalised activities based on your child's age, interests and learning goals.",
    flow: [
      { label: "Photo of toy", emoji: "📸" },
      { label: "AI recognition", emoji: "✨" },
      { label: "5 activity ideas", emoji: "🎯" },
      { label: "Skills developed", emoji: "📈" },
      { label: "Add to Today's Plan", emoji: "☀️" },
    ],
    benefits: [
      "Uses toys you already own",
      "Saves preparation time",
      "Encourages creativity",
      "Builds developmental skills",
    ],
    cta: "Try Toy Brain",
    href: "/toy-brain",
    theme: "coral",
  },
  {
    id: "adventure",
    emoji: "📋",
    title: "Adventure Routine Planner",
    headline: "Turn Daily Routines Into Adventures.",
    description:
      "Generate beautiful printable adventure posters personalised for your child. Make brushing teeth, bath time and bedtime feel like exciting missions.",
    flow: [
      { label: "Bedtime routine", emoji: "🛁" },
      { label: "Dinosaur adventure", emoji: "🦕" },
      { label: "Mission complete", emoji: "⭐" },
      { label: "QR code poster", emoji: "📱" },
      { label: "Story time", emoji: "📖" },
    ],
    benefits: [
      "Less resistance at routine time",
      "Builds independence",
      "Printable at home",
      "Beautiful designs",
    ],
    cta: "Create Adventure Poster",
    href: "/adventure-journey",
    theme: "sage",
  },
  {
    id: "storytime",
    emoji: "🌙",
    title: "Family Voice Storytime",
    headline: "Bedtime Stories In Your Own Voice.",
    description:
      "Create personalised bedtime stories narrated using your family's voice. Stay emotionally connected even when you're away.",
    flow: [
      { label: "Choose narrator", emoji: "🎙️" },
      { label: "Generate story", emoji: "✨" },
      { label: "Press play", emoji: "▶️" },
      { label: "Sweet dreams", emoji: "😴" },
    ],
    benefits: [
      "Emotional connection",
      "Personalised stories",
      "Family memories",
      "Premium bedtime experience",
    ],
    cta: "Listen To Sample Story",
    href: "/stories",
    badge: "Premium",
    theme: "sky",
  },
];

export type JourneyStage = {
  emoji: string;
  period: string;
  title: string;
  feature: string;
  icon: LucideIcon;
};

export const DAILY_JOURNEY_V2: JourneyStage[] = [
  { emoji: "☀️", period: "Morning", title: "Today's Plan", feature: "Toy Brain", icon: Sun },
  { emoji: "🎮", period: "Play", title: "Toy Brain", feature: "Activities", icon: Gamepad2 },
  { emoji: "🌤", period: "Afternoon", title: "Learning Activities", feature: "Skills", icon: Brain },
  { emoji: "🍽", period: "Dinner", title: "Meal Suggestions", feature: "Recipes", icon: UtensilsCrossed },
  { emoji: "📋", period: "Evening", title: "Adventure Routine", feature: "Poster", icon: Printer },
  { emoji: "🌙", period: "Bedtime", title: "Family Voice Story", feature: "Listen", icon: Moon },
];

export type SupportingFeature = { icon: LucideIcon; label: string; href: string };

export const SUPPORTING_FEATURES: SupportingFeature[] = [
  { icon: Sparkles, label: "Today's Plan", href: "/today" },
  { icon: Bot, label: "MumBot Parenting Copilot", href: "/mumbot" },
  { icon: Gamepad2, label: "Activity Library", href: "/activities" },
  { icon: ChefHat, label: "Recipes", href: "/today" },
  { icon: Trophy, label: "Milestones", href: "/memory" },
  { icon: Calendar, label: "Weekly Growth Reports", href: "/weekly-report" },
  { icon: Users, label: "Multiple Child Profiles", href: "/profile" },
];

export const COMPARISON_V2 = {
  generic: [
    "Generic parenting advice",
    "Requires prompts every time",
    "No child profile",
    "No daily routines",
    "No toy recognition",
    "No printable posters",
    "No family voice",
  ],
  parenfy: [
    "Personalised for your child",
    "Structured daily journey",
    "Toy Brain",
    "Adventure Posters",
    "Family Voice Storytime",
    "Growth tracking",
    "Daily parenting companion",
  ],
} as const;

export const TESTIMONIALS_V2 = [
  {
    stars: 5,
    quote: "The printable routine poster completely changed bedtime.",
    name: "Emma",
    role: "Mum of 3 · Beta parent",
  },
  {
    stars: 5,
    quote: "I finally know what to do with all our toys.",
    name: "David",
    role: "Dad · Beta parent",
  },
  {
    stars: 5,
    quote: "My daughter wants another story every night.",
    name: "Aisha",
    role: "Mum · Premium",
  },
] as const;

export type ScreenshotItem = {
  id: string;
  title: string;
  theme: "warm" | "play" | "adventure" | "bedtime";
};

export const SCREENSHOTS: ScreenshotItem[] = [
  { id: "today", title: "Today's Plan", theme: "warm" },
  { id: "toy", title: "Toy Brain", theme: "play" },
  { id: "adventure", title: "Adventure Poster", theme: "adventure" },
  { id: "story", title: "Family Voice Story", theme: "bedtime" },
];

export const PRICING_V2 = {
  free: {
    name: "Free",
    features: ["Today's Plan", "Activities", "Stories", "Basic MumBot"],
    cta: "Start Free",
  },
  premium: {
    name: "Premium",
    highlighted: true,
    features: [
      "Adventure Posters",
      "Unlimited Stories",
      "Family Voice Storytime",
      "Toy Brain",
      "Weekly Reports",
      "Future Features",
    ],
    cta: "Start Free",
  },
} as const;

export const FAQ_V2 = [
  {
    question: "What age is Parenfy for?",
    answer:
      "Parenfy is designed for families with children aged 0–6, though many parents use activities and stories flexibly for slightly older siblings too.",
  },
  {
    question: "Can I add multiple children?",
    answer:
      "Yes. Free includes one child profile. Premium supports richer personalisation; the Family plan covers up to four child profiles.",
  },
  {
    question: "Can grandparents record stories?",
    answer:
      "Absolutely. Any family member with Premium can record a voice profile — Grandma, Grandad, Mum, or Dad — for Family Voice Storytime.",
  },
  {
    question: "Is my child's information private?",
    answer:
      "You control what you save. Edit or delete profiles, voices, and stories anytime. We never sell personal data. See our Privacy Policy for details.",
  },
  {
    question: "How does Toy Brain work?",
    answer:
      "Snap a photo of a toy. Our AI identifies it and suggests age-appropriate play ideas linked to your child's goals — then add favourites to Today's Plan.",
  },
  {
    question: "Can I print Adventure Posters?",
    answer:
      "Yes. Adventure Routine Planner creates beautiful printable posters with QR codes — perfect for bathroom, bedroom, or fridge.",
  },
] as const;

export const FINAL_CTA = {
  headline: "Create More Magical Moments Every Day.",
  description: "Join thousands of parents building happier family routines.",
  cta: "Create Free Account",
} as const;

export const THEME_STYLES = {
  coral: {
    bg: "from-orange-50 via-amber-50/80 to-background dark:from-orange-950/30 dark:via-background dark:to-background",
    accent: "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-200",
    ring: "ring-orange-200/60 dark:ring-orange-800/40",
  },
  sage: {
    bg: "from-emerald-50 via-teal-50/60 to-background dark:from-emerald-950/25 dark:via-background dark:to-background",
    accent: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
    ring: "ring-emerald-200/60 dark:ring-emerald-800/40",
  },
  sky: {
    bg: "from-sky-50 via-indigo-50/50 to-background dark:from-indigo-950/30 dark:via-background dark:to-background",
    accent: "bg-sky-100 text-sky-900 dark:bg-indigo-950/50 dark:text-indigo-200",
    ring: "ring-sky-200/60 dark:ring-indigo-800/40",
  },
} as const;

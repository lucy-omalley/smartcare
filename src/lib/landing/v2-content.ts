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
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

export const V2_NAV = [
  { href: "#experiences", label: "Experiences" },
  { href: "#journey", label: "Your day" },
  { href: "#testimonials", label: "Stories" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
] as const;

export const HERO = {
  headline: "Your AI Family Companion",
  subheadlineLines: [
    "Helping busy parents create calmer mornings,",
    "more meaningful play,",
    "easier routines",
    "and magical bedtimes.",
  ],
  primaryCta: "Start Free",
  secondaryCta: "Watch Demo",
  demoTarget: "#experiences",
  socialProof: "Loved by early beta parents.",
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
  cta: string;
  href: string;
  badge?: string;
  theme: "coral" | "sage" | "sky";
};

export const HERO_EXPERIENCES_V2: HeroExperienceV2[] = [
  {
    id: "toy-brain",
    emoji: "🧸",
    title: "Toy Brain",
    headline: "Snap Any Toy.\nDiscover New Ways To Play.",
    description:
      "Photograph any toy. Parenfy recognises it and creates personalised activities for your child's age and interests.",
    flow: [
      { label: "Phone takes photo", emoji: "📸" },
      { label: "Toy recognised", emoji: "✨" },
      { label: "5 personalised activities", emoji: "🎯" },
      { label: "Learning skills", emoji: "📈" },
      { label: "Add to Today's Plan", emoji: "☀️" },
    ],
    cta: "Explore Toy Brain",
    href: "/toy-brain",
    theme: "coral",
  },
  {
    id: "adventure",
    emoji: "📋",
    title: "Adventure Routine Planner",
    headline: "Turn Daily Routines Into Adventures.",
    description:
      "Generate beautiful printable adventure posters. Make brushing teeth, bath time and bedtime feel like exciting missions.",
    flow: [
      { label: "Generate Adventure", emoji: "🦕" },
      { label: "Print Poster", emoji: "🖨️" },
      { label: "Child completes missions", emoji: "⭐" },
      { label: "QR Story", emoji: "📱" },
    ],
    cta: "Create Adventure",
    href: "/adventure-journey",
    theme: "sage",
  },
  {
    id: "storytime",
    emoji: "🌙",
    title: "Family Voice Storytime",
    headline: "Bedtime Stories In The Voices They Love.",
    description:
      "Personalised bedtime stories narrated in your family's voice — stay emotionally connected even when you're away.",
    flow: [
      { label: "Choose narrator", emoji: "🎙️" },
      { label: "Generate story", emoji: "✨" },
      { label: "Play story", emoji: "▶️" },
      { label: "Happy bedtime", emoji: "😴" },
    ],
    cta: "Listen To Sample",
    href: "/stories",
    badge: "Premium",
    theme: "sky",
  },
];

export const SECTIONS = {
  experiences: {
    eyebrow: "Three hero experiences",
    title: "Built for real family days",
    description: "Play, routines, and bedtime — each given equal room to shine.",
  },
  journey: {
    eyebrow: "Your day",
    title: "How Parenfy fits into your day",
    description: "One gentle journey from morning plan to bedtime story.",
  },
  supporting: {
    eyebrow: "Supporting tools",
    title: "Everything else, when you need it",
    description: "Helpful extras that stay out of the way until you reach for them.",
  },
  testimonials: {
    eyebrow: "Beta parents",
    title: "Loved by early beta parents",
    description: "Real feedback from families shaping Parenfy with us.",
  },
  pricing: {
    eyebrow: "Pricing",
    title: "Start free. Upgrade when you're ready.",
    description: "No credit card required to begin your family journey.",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Questions? We've got you.",
  },
} as const;

export type JourneyStage = {
  emoji: string;
  period: string;
  title: string;
  feature: string;
  icon: LucideIcon;
};

export const DAILY_JOURNEY_V2: JourneyStage[] = [
  { emoji: "☀️", period: "Morning", title: "Today's Plan", feature: "Your daily guide", icon: Sun },
  { emoji: "🎮", period: "Play", title: "Toy Brain", feature: "Snap & discover", icon: Gamepad2 },
  { emoji: "🌤", period: "Learning", title: "Activities", feature: "Skills & growth", icon: Brain },
  { emoji: "📋", period: "Evening", title: "Adventure Routine", feature: "Mission poster", icon: Printer },
  { emoji: "🌙", period: "Bedtime", title: "Family Voice Story", feature: "Stories they love", icon: Moon },
];

export type SupportingFeature = { icon: LucideIcon; label: string; href: string };

export const SUPPORTING_FEATURES: SupportingFeature[] = [
  { icon: Sparkles, label: "Today's Plan", href: "/today" },
  { icon: Bot, label: "MumBot Parenting Copilot", href: "/mumbot" },
  { icon: Gamepad2, label: "Activity Library", href: "/activities" },
  { icon: ChefHat, label: "Meal Planner", href: "/today" },
  { icon: TrendingUp, label: "Growth Reports", href: "/weekly-report" },
  { icon: Users, label: "Multiple Child Profiles", href: "/profile" },
];

export const TESTIMONIALS_V2 = [
  {
    stars: 5,
    quote: "The printable routine poster completely changed bedtime. My son actually asks for his dinosaur missions now.",
    name: "Emma",
    role: "Mum of 3 · Beta parent",
  },
  {
    stars: 5,
    quote: "I finally know what to do with all our toys. Toy Brain turned a rainy afternoon into the best play session we've had.",
    name: "David",
    role: "Dad · Beta parent",
  },
  {
    stars: 5,
    quote: "Hearing Grandma's voice read tonight's story — my daughter asks for another one every single night.",
    name: "Aisha",
    role: "Mum · Premium",
  },
] as const;

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
  headline: "Create Your Free Account",
  description: "Join thousands of parents building happier family routines — starting today.",
  cta: "Create Your Free Account",
} as const;

export const THEME_STYLES = {
  coral: {
    bg: "from-orange-50 via-amber-50/80 to-background dark:from-orange-950/30 dark:via-background dark:to-background",
    accent: "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-200",
    ring: "ring-orange-200/60 dark:ring-orange-800/40",
    glow: "shadow-orange-200/40 dark:shadow-orange-900/20",
  },
  sage: {
    bg: "from-emerald-50 via-teal-50/60 to-background dark:from-emerald-950/25 dark:via-background dark:to-background",
    accent: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
    ring: "ring-emerald-200/60 dark:ring-emerald-800/40",
    glow: "shadow-emerald-200/40 dark:shadow-emerald-900/20",
  },
  sky: {
    bg: "from-sky-50 via-indigo-50/50 to-background dark:from-indigo-950/30 dark:via-background dark:to-background",
    accent: "bg-sky-100 text-sky-900 dark:bg-indigo-950/50 dark:text-indigo-200",
    ring: "ring-sky-200/60 dark:ring-indigo-800/40",
    glow: "shadow-sky-200/40 dark:shadow-indigo-900/20",
  },
} as const;

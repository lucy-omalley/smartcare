import {
  Bot,
  Calendar,
  ChefHat,
  Gamepad2,
  Moon,
  Printer,
  Sparkles,
  Sprout,
  Sun,
  TrendingUp,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export const V2_NAV = [
  { href: "#journey", label: "Your day" },
  { href: "#growth", label: "Growth" },
  { href: "#experiences", label: "Experiences" },
  { href: "#testimonials", label: "Parents" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
] as const;

export const HERO = {
  headline: "Your AI Family Companion",
  subheadline:
    "Helping busy parents plan, play, build routines and create magical bedtime moments.",
  valueLines: [
    "One app that helps your family every day.",
    "Personalised plans.",
    "Creative play.",
    "Adventure routines.",
    "Stories in your own voice.",
  ],
  primaryCta: "Start Free",
  secondaryCta: "Watch Demo",
  demoTarget: "#experiences",
  socialProof: "Loved by Beta Parents",
  trustBadges: ["Privacy First"] as const,
} as const;

export const TRUST_BADGES = [
  "Free to Start",
  "Privacy First",
] as const;

export type FlowStep = { label: string; emoji?: string; accent?: string };

export type HeroExperienceV2 = {
  id: string;
  emoji: string;
  headline: string;
  title: string;
  description: string;
  imageKey: "toyBrain" | "adventure" | "story";
  imageAlt: string;
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
      "Photograph any toy and get age-appropriate play ideas — using what you already own.",
    imageKey: "toyBrain",
    imageAlt: "Toy Brain app showing toy recognition and personalised play activities",
    cta: "Explore Toy Brain",
    href: "/toy-brain",
    theme: "coral",
  },
  {
    id: "adventure",
    emoji: "📋",
    title: "Adventure Planner",
    headline: "Turn Daily Routines Into Adventures.",
    description:
      "Beautiful printable adventure posters that make brushing teeth, bath time and bedtime feel like missions.",
    imageKey: "adventure",
    imageAlt: "Adventure Routine Planner with printable poster and QR story",
    cta: "Create Adventure",
    href: "/adventure-journey",
    theme: "sage",
  },
  {
    id: "storytime",
    emoji: "🌙",
    title: "Family Voice Story",
    headline: "Bedtime Stories In The Voices They Love.",
    description:
      "Personalised stories narrated in Mum, Dad, or Grandma's voice — even when you can't be there.",
    imageKey: "story",
    imageAlt: "Family Voice Storytime with voice library and bedtime story player",
    cta: "Try Story",
    href: "/stories",
    badge: "Premium",
    theme: "sky",
  },
];

export const SECTIONS = {
  journey: {
    eyebrow: "Your day",
    title: "Daily Family Journey",
    description: "From morning plan to bedtime story — one calm flow through your day.",
  },
  growth: {
    eyebrow: "Growth Journey",
    title: "Your personal child development coach",
    description:
      "From birth to primary school — know how your child is doing, what to practise this week, and what fun activity to try today.",
  },
  experiences: {
    eyebrow: "Hero experiences",
    title: "Three ways Parenfy helps every day",
    description: "Play, routines, and bedtime — each built for real family moments.",
  },
  testimonials: {
    eyebrow: "Why parents love Parenfy",
    title: "Why Parents Love Parenfy",
    description: "Real feedback from beta families.",
  },
  supporting: {
    eyebrow: "Everything else",
    title: "Everything Else",
    description: "Helpful tools that stay out of the way until you need them.",
  },
  pricing: {
    eyebrow: "Pricing",
    title: "Start free. Upgrade when you're ready.",
    description: "No credit card required to begin.",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Questions? We've got you.",
  },
} as const;

export type GrowthJourneyFeature = {
  emoji: string;
  title: string;
  description: string;
};

export const GROWTH_JOURNEY_MARKETING = {
  features: [
    {
      emoji: "🎯",
      title: "This week's mission",
      description: "A clear weekly focus with progress you earn by completing real activities.",
    },
    {
      emoji: "🌱",
      title: "Today's mission",
      description: "One playful activity matched to your child's age, interests, and learning goals.",
    },
    {
      emoji: "😊",
      title: "Skills dashboard",
      description: "Beautiful skill cards that grow as you play — never judgement, always encouragement.",
    },
    {
      emoji: "🗺",
      title: "Personalised roadmap",
      description: "See where your child is on their journey from baby to primary school.",
    },
    {
      emoji: "✨",
      title: "AI development coach",
      description: "Short, actionable insights — what to try, why now, and how you can help.",
    },
  ] satisfies GrowthJourneyFeature[],
  mock: {
    childName: "Shea",
    ageDisplay: "3 years 8 months",
    stageLabel: "Preschool Explorer",
    growthTheme: "Emotional Regulation",
    weeklyProgress: 40,
    weeklyMission: "Helping Shea recognise and express emotions confidently.",
    todaysMission: "Emotion Train Adventure",
    missionMinutes: 10,
    skills: [
      { emoji: "😊", label: "Emotional Regulation", progress: 40 },
      { emoji: "🗣", label: "Communication", progress: 25 },
      { emoji: "🤝", label: "Social Skills", progress: 15 },
    ],
  },
  cta: "Start Your Growth Journey",
  ctaSecondary: "See how it works",
} as const;

export type JourneyStage = {
  emoji: string;
  period: string;
  title: string;
  feature: string;
  icon: LucideIcon;
  gradient: string;
};

export const DAILY_JOURNEY_V2: JourneyStage[] = [
  {
    emoji: "☀️",
    period: "Morning",
    title: "Today's Journey",
    feature: "Your personalised daily plan",
    icon: Sun,
    gradient: "from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20",
  },
  {
    emoji: "🎮",
    period: "Play",
    title: "Toy Brain",
    feature: "Snap a toy, discover play",
    icon: Gamepad2,
    gradient: "from-sky-50 to-cyan-50 dark:from-sky-950/40 dark:to-cyan-950/20",
  },
  {
    emoji: "📋",
    period: "Evening",
    title: "Adventure Routine",
    feature: "Routines as missions",
    icon: Printer,
    gradient: "from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20",
  },
  {
    emoji: "🌙",
    period: "Night",
    title: "Family Voice Story",
    feature: "Stories in voices they love",
    icon: Moon,
    gradient: "from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/20",
  },
];

export type SupportingFeature = { icon: LucideIcon; label: string; href: string };

export const SUPPORTING_FEATURES: SupportingFeature[] = [
  { icon: Sparkles, label: "Today's Plan", href: "/today" },
  { icon: Sprout, label: "Growth Journey", href: "#growth" },
  { icon: Bot, label: "MumBot", href: "/mumbot" },
  { icon: Gamepad2, label: "Activities", href: "/activities" },
  { icon: UtensilsCrossed, label: "Recipes", href: "/saved" },
  { icon: TrendingUp, label: "Weekly Reports", href: "/weekly-report" },
  { icon: Users, label: "Multiple Child Profiles", href: "/profile" },
  { icon: ChefHat, label: "Meal Planner", href: "/today" },
];

export type TestimonialHighlight = "Routine Poster" | "Toy Brain" | "Today's Journey";

export const TESTIMONIALS_V2 = [
  {
    stars: 5,
    quote: "The printable routine poster completely changed bedtime. My son actually asks for his dinosaur missions now.",
    name: "Emma",
    role: "Mum of 3 · Beta parent",
    highlight: "Routine Poster" as TestimonialHighlight,
  },
  {
    stars: 5,
    quote: "I finally know what to do with all our toys. Toy Brain turned a rainy afternoon into the best play session we've had.",
    name: "David",
    role: "Dad · Beta parent",
    highlight: "Toy Brain" as TestimonialHighlight,
  },
  {
    stars: 5,
    quote: "Opening Today's Journey each morning tells me exactly what to do — meal, activity, and tonight's story. It's become our family rhythm.",
    name: "Lucy",
    role: "Mum · Beta parent",
    highlight: "Today's Journey" as TestimonialHighlight,
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
    "Growth Journey coach (0–8 years)",
    "Toy Brain",
    "Adventure Posters",
    "Family Voice Storytime",
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
      "Growth Journey",
      "Weekly Reports",
      "Future Features",
    ],
    cta: "Start Free",
  },
} as const;

export const FAQ_V2 = [
  {
    question: "What is Growth Journey?",
    answer:
      "Growth Journey is Parenfy's personal child development coach for ages 0–8. It shows your weekly mission, today's activity, skill progress, milestones, and gentle coaching — all based on activities you actually complete, not generic AI reports.",
  },
  {
    question: "Who is Parenfy for?",
    answer:
      "Parenfy personalises plans, play, and stories around your child's profile. Many families use activities and stories flexibly for siblings too.",
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
  headline: "Create More Magical Family Moments",
  description: "Join thousands of parents building happier family routines — starting today.",
  cta: "Create Free Account",
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

export const TESTIMONIAL_HIGHLIGHT_STYLES: Record<TestimonialHighlight, string> = {
  "Routine Poster": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  "Toy Brain": "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200",
  "Today's Journey": "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
};

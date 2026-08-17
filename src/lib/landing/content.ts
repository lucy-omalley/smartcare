import {
  MessageCircle,
  Mic,
  Sparkles,
  Sun,
  UtensilsCrossed,
  Moon,
  Gamepad2,
  Brain,
  type LucideIcon,
} from "lucide-react";

export const LANDING_NAV = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#experiences", label: "Experiences" },
  { href: "#journey", label: "Daily journey" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
] as const;

export const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Tell us about your child",
    description: "Age, interests, and goals — so every suggestion fits your family.",
  },
  {
    step: "2",
    title: "Open Today's Plan",
    description: "Meals, activities, stories, and language ideas — curated for today.",
  },
  {
    step: "3",
    title: "Play, listen, connect",
    description: "Use MumBot when you need a co-pilot, record your voice for stories, and grow together.",
  },
] as const;

export type HeroExperience = {
  icon: LucideIcon;
  title: string;
  tagline: string;
  description: string;
  href: string;
  badge?: string;
};

export const HERO_EXPERIENCES: HeroExperience[] = [
  {
    icon: Mic,
    title: "Family Voice Storytime",
    tagline: "Bedtime in your voice",
    description:
      "Record a short reading once. Parenfy narrates AI bedtime stories in your cloned voice — even when you're not in the room.",
    href: "/stories",
    badge: "Premium",
  },
  {
    icon: Sparkles,
    title: "Today's Plan",
    tagline: "What to do today",
    description:
      "A calm daily dashboard with meals, activities, stories, and language practice — personalised to your child.",
    href: "/today",
  },
  {
    icon: MessageCircle,
    title: "MumBot",
    tagline: "Your parenting co-pilot",
    description:
      "Warm, practical answers that remember your child — not a blank chat every time.",
    href: "/mumbot",
  },
];

export type JourneyStep = {
  time: string;
  icon: LucideIcon;
  title: string;
  description: string;
};

export const DAILY_JOURNEY: JourneyStep[] = [
  {
    time: "Morning",
    icon: Sun,
    title: "Today's Plan",
    description: "See meals, activities, and focus areas for the day ahead.",
  },
  {
    time: "Midday",
    icon: Gamepad2,
    title: "Play & learn",
    description: "Toy Brain ideas, adventures, and development activities matched to your child.",
  },
  {
    time: "Afternoon",
    icon: Brain,
    title: "Language & skills",
    description: "Short language prompts and learning moments woven into real life.",
  },
  {
    time: "Evening",
    icon: UtensilsCrossed,
    title: "Meals made simple",
    description: "Fridge-to-recipe ideas and child-friendly dinners without the scroll.",
  },
  {
    time: "Bedtime",
    icon: Moon,
    title: "Stories in your voice",
    description: "Listen to a personalised tale narrated by Mum, Dad, or a grandparent.",
  },
];

export const TESTIMONIALS = [
  {
    quote:
      "The Today plan stopped me doom-scrolling for activity ideas. I open one app and know what we're doing.",
    name: "Sarah",
    role: "Mum of 2 · Beta parent",
  },
  {
    quote:
      "Hearing bedtime stories in my voice while I'm still at work — that's the feature I didn't know I needed.",
    name: "James",
    role: "Dad · Premium",
  },
  {
    quote:
      "MumBot feels like it actually knows our son. It's not generic parenting advice.",
    name: "Priya",
    role: "Guardian · Beta parent",
  },
] as const;

export const FEATURE_COMPARISON = [
  {
    topic: "Remembers your child",
    generic: "Starts fresh every chat",
    parenfy: "Profile, age, interests, and goals persist",
  },
  {
    topic: "Daily structure",
    generic: "You decide what to ask",
    parenfy: "Today's Plan tells you what to do today",
  },
  {
    topic: "Bedtime stories",
    generic: "Text-only or generic voice",
    parenfy: "AI stories + family voice narration",
  },
  {
    topic: "Parenting tools",
    generic: "One chat window",
    parenfy: "Meals, stories, activities, routines — one OS",
  },
  {
    topic: "Community",
    generic: "Not built for local parents",
    parenfy: "Connect with parents nearby (beta)",
  },
] as const;

export const PRICING_TIERS = [
  {
    id: "free",
    name: "Free",
    price: "£0",
    period: "forever",
    description: "Try Parenfy during Public Beta.",
    features: [
      "Today's Plan (limited)",
      "3 AI bedtime stories / month",
      "MumBot with daily limits",
      "Connect & community (beta)",
    ],
    cta: "Join free",
    href: "/auth/register",
    highlighted: false,
  },
  {
    id: "premium",
    name: "Premium",
    price: "Paid",
    period: "per month",
    description: "Unlimited daily guidance + signature Family Voice Storytime.",
    features: [
      "Unlimited Today plans & MumBot",
      "Family Voice Storytime",
      "Record & clone your voice",
      "Story library & weekly books",
      "Toy Brain & Adventure Journey",
    ],
    cta: "Start Premium",
    href: "/auth/register",
    highlighted: true,
  },
  {
    id: "family",
    name: "Family",
    price: "Paid",
    period: "per month",
    description: "Premium for up to four child profiles.",
    features: [
      "Everything in Premium",
      "Up to 4 child profiles",
      "Shared family voice library",
      "Best for siblings",
    ],
    cta: "Start Family",
    href: "/auth/register",
    highlighted: false,
  },
] as const;

export const LANDING_FAQ = [
  {
    question: "Is Parenfy a medical or emergency service?",
    answer:
      "No. Parenfy offers everyday parenting guidance and activities — not diagnosis, treatment, or emergency support. Always contact your GP, health visitor, or emergency services for medical concerns.",
  },
  {
    question: "How does Family Voice Storytime work?",
    answer:
      "Premium parents record short voice samples in the app. Parenfy uses AI to narrate bedtime stories in a voice that sounds like you. First-time narration may take a minute to prepare; replays are instant.",
  },
  {
    question: "What's included in Public Beta?",
    answer:
      "Core features — Today, MumBot, stories, meals, and Connect — are live. Some areas are still polishing based on parent feedback. Tap Feedback in the app anytime.",
  },
  {
    question: "Can I cancel Premium anytime?",
    answer:
      "Yes. Manage or cancel your subscription from Billing in the app. You'll keep access until the end of your billing period.",
  },
  {
    question: "Is my family's data private?",
    answer:
      "You control what you save. Voice recordings are encrypted, and you can delete voices and stories anytime. See our Privacy Policy for details.",
  },
] as const;

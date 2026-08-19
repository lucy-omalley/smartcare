import type { Locale } from "@/lib/i18n/config";
import {
  DAILY_JOURNEY_V2,
  FAQ_V2,
  GROWTH_JOURNEY_MARKETING,
  HERO_EXPERIENCES_V2,
  PRICING_V2,
  SECTIONS,
  SUPPORTING_FEATURES,
  TESTIMONIALS_V2,
  type HeroExperienceV2,
  type JourneyStage,
  type SupportingFeature,
} from "@/lib/landing/v2-content";

const ZH_SECTIONS = {
  journey: {
    eyebrow: "每日流程",
    title: "一天的家庭陪伴",
    description: "从早晨计划到睡前故事，轻松完成每一天。",
  },
  growth: {
    eyebrow: "成长旅程",
    title: "专属的儿童成长教练",
    description: "从出生到小学 — 了解孩子近况、本周练习重点，以及今天可以玩的趣味活动。",
  },
  experiences: {
    eyebrow: "核心功能",
    title: "Parenfy 每天帮你的三件事",
    description: "亲子活动、冒险任务、家庭声音故事 — 为真实家庭场景设计。",
  },
  testimonials: {
    eyebrow: "家长评价",
    title: "Beta 家长怎么说",
    description: "来自真实家庭的反馈。",
  },
  supporting: {
    eyebrow: "更多功能",
    title: "更多实用工具",
    description: "需要时再用，不打扰日常。",
  },
  pricing: {
    eyebrow: "价格",
    title: "免费开始，随时升级",
    description: "注册无需信用卡。",
  },
  faq: {
    eyebrow: "常见问题",
    title: "有问题？看这里",
  },
} as const;

const ZH_JOURNEY: JourneyStage[] = DAILY_JOURNEY_V2.map((stage, i) => {
  const zh = [
    { period: "早晨", title: "今日成长计划", feature: "个性化每日计划" },
    { period: "玩耍", title: "玩具玩法", feature: "拍玩具，发现玩法" },
    { period: "傍晚", title: "冒险任务", feature: "Routine 变冒险" },
    { period: "夜晚", title: "家庭声音故事", feature: "家人声音讲睡前故事" },
  ][i];
  return { ...stage, ...zh };
});

const ZH_HERO_EXPERIENCES: HeroExperienceV2[] = HERO_EXPERIENCES_V2.map((exp, i) => {
  const zh = [
    {
      title: "玩具玩法",
      headline: "拍一下玩具\n发现更多玩法",
      description: "拍照识别玩具，获取适合孩子年龄的玩法建议。",
      cta: "体验玩具玩法",
    },
    {
      title: "冒险任务",
      headline: "把每天 Routine\n变成孩子喜欢的冒险",
      description: "可打印的冒险海报，让刷牙、洗澡、睡觉变成小任务。",
      cta: "创建冒险",
    },
    {
      title: "家庭声音故事",
      headline: "用爸爸妈妈的声音\n讲属于孩子的故事",
      description: "个性化睡前故事，用家人熟悉的声音陪伴。",
      cta: "体验故事",
    },
  ][i];
  return { ...exp, ...zh };
});

const ZH_SUPPORTING: SupportingFeature[] = SUPPORTING_FEATURES.map((item, i) => {
  const labels = ["今日计划", "成长旅程", "育儿小助手", "亲子活动", "食谱", "每周报告", "多孩子档案", "餐食计划"];
  return { ...item, label: labels[i] ?? item.label };
});

const ZH_GROWTH_JOURNEY = {
  ...GROWTH_JOURNEY_MARKETING,
  features: GROWTH_JOURNEY_MARKETING.features.map((feature, i) => {
    const zh = [
      { title: "本周任务", description: "清晰的每周成长主题 — 完成真实活动即可累积进度。" },
      { title: "今日任务", description: "一项适合孩子年龄、兴趣和目标的趣味活动。" },
      { title: "技能看板", description: "随着亲子游戏逐步成长 — 鼓励为主，从不评判。" },
      { title: "个性化路线图", description: "从婴儿到小学，看见孩子所处的成长阶段。" },
      { title: "AI 成长教练", description: "简短可执行的建议 — 做什么、为什么、如何陪伴。" },
    ][i];
    return { ...feature, ...zh };
  }),
  mock: {
    ...GROWTH_JOURNEY_MARKETING.mock,
    childName: "小Shea",
    ageDisplay: "3岁8个月",
    stageLabel: "学前探索者",
    growthTheme: "情绪调节",
    weeklyMission: "帮助 Shea 识别并自信地表达情绪。",
    todaysMission: "情绪小火车冒险",
    skills: [
      { emoji: "😊", label: "情绪调节", progress: 40 },
      { emoji: "🗣", label: "语言表达", progress: 25 },
      { emoji: "🤝", label: "社交技能", progress: 15 },
    ],
  },
  cta: "开启成长旅程",
  ctaSecondary: "了解如何使用",
} as const;

const HIGHLIGHT_ZH: Record<string, string> = {
  "Routine Poster": "冒险任务",
  "Toy Brain": "玩具玩法",
  "Today's Journey": "今日成长计划",
};

const ZH_TESTIMONIALS = TESTIMONIALS_V2.map((t, i) => {
  const zh = [
    {
      quote: "可打印的冒险海报彻底改变了睡前时光，儿子现在主动要求做恐龙任务。",
      name: "Emma",
      role: "3岁孩子妈妈 · Beta 家长",
    },
    {
      quote: "终于知道家里的玩具怎么玩了。玩具玩法让雨天下午变成了最好的亲子时光。",
      name: "David",
      role: "爸爸 · Beta 家长",
    },
    {
      quote: "每天打开今日成长计划，就知道吃什么、玩什么、讲什么故事 — 成了我们家的节奏。",
      name: "Lucy",
      role: "妈妈 · Beta 家长",
    },
  ][i];
  return { ...t, ...zh, highlightLabel: HIGHLIGHT_ZH[t.highlight] ?? t.highlight };
});

const ZH_PRICING = {
  free: {
    name: "免费版",
    features: ["今日计划", "亲子活动", "故事", "基础育儿小助手"],
    cta: "免费体验",
  },
  premium: {
    name: "高级版",
    highlighted: true,
    features: ["冒险任务海报", "无限故事", "家庭声音故事", "玩具玩法", "成长旅程", "每周报告", "未来新功能"],
    cta: "免费体验",
  },
} as const;

const ZH_FAQ = [
  {
    question: "什么是成长旅程？",
    answer:
      "成长旅程是 Parenfy 为 0–8 岁孩子打造的专属成长教练。它会展示本周任务、今日活动、技能进度和里程碑 — 全部基于您实际完成的亲子活动，而不是泛泛的 AI 报告。",
  },
  {
    question: "Parenfy 适合谁？",
    answer: "Parenfy 会根据您孩子的档案个性化计划、游戏和故事。许多家庭也会灵活地让兄弟姐妹一起使用。",
  },
  {
    question: "可以添加多个孩子吗？",
    answer: "可以。免费版包含一个孩子档案。高级版支持更丰富的个性化。",
  },
  {
    question: "爷爷奶奶可以录制故事吗？",
    answer: "当然可以。任何家人都可以录制声音，用于家庭声音故事。",
  },
  {
    question: "孩子的信息会保密吗？",
    answer: "您完全掌控保存的内容，可随时编辑或删除档案、声音和故事。我们不会出售个人数据。",
  },
  {
    question: "玩具玩法怎么用？",
    answer: "拍一张玩具照片，AI 识别后会根据孩子年龄和目标推荐玩法，可加入今日计划。",
  },
  {
    question: "冒险任务可以打印吗？",
    answer: "可以。冒险任务会生成精美可打印海报，带二维码 — 适合贴在浴室、卧室或冰箱上。",
  },
] as const;

export function getLandingSections(locale: Locale) {
  return locale === "zh-CN" ? ZH_SECTIONS : SECTIONS;
}

export function getDailyJourney(locale: Locale) {
  return locale === "zh-CN" ? ZH_JOURNEY : DAILY_JOURNEY_V2;
}

export function getHeroExperiences(locale: Locale) {
  return locale === "zh-CN" ? ZH_HERO_EXPERIENCES : HERO_EXPERIENCES_V2;
}

export function getSupportingFeatures(locale: Locale) {
  return locale === "zh-CN" ? ZH_SUPPORTING : SUPPORTING_FEATURES;
}

export function getTestimonials(locale: Locale) {
  return locale === "zh-CN" ? ZH_TESTIMONIALS : TESTIMONIALS_V2;
}

export function getPricing(locale: Locale) {
  return locale === "zh-CN" ? ZH_PRICING : PRICING_V2;
}

export function getFaq(locale: Locale) {
  return locale === "zh-CN" ? ZH_FAQ : FAQ_V2;
}

export function getGrowthJourneyMarketing(locale: Locale) {
  return locale === "zh-CN" ? ZH_GROWTH_JOURNEY : GROWTH_JOURNEY_MARKETING;
}

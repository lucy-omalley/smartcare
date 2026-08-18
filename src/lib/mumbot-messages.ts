import type { Locale } from "@/lib/i18n/config";

export function generateWelcomeMessage(name?: string | null, locale: Locale = "en"): string {
  const first = name?.split(" ")[0];
  if (locale === "zh-CN") {
    const greeting = first ? `你好 ${first} 👋` : "你好 👋";
    return `${greeting}

我是 **育儿小助手**，你的 AI 育儿伙伴。

无论是活动灵感、饮食建议，还是日常育儿难题，我都可以帮你。

今天准备陪孩子做些什么呢？`;
  }
  const greeting = first ? `Hi ${first} 👋` : "Hi there 👋";
  return `${greeting}

I'm **MumBot**, your AI Co-Parent.

I'm here whenever you need parenting advice, activity ideas, or simply someone to think things through with.

Let's raise happy children together. What's on your mind today?`;
}

export function generateParentingTipStatic(): string {
  const tips = [
    "Try narrating what you're doing today — 'Now we're putting on your shoes' — it builds language skills naturally.",
    "When your child is upset, get down to their eye level. Connection before correction.",
    "Celebrate effort, not just results. 'You tried so hard!' goes a long way.",
    "A predictable bedtime routine — bath, book, bed — helps little ones feel safe.",
    "It's okay to say 'I'm feeling frustrated too.' Modelling emotions teaches emotional intelligence.",
    "Five minutes of undivided play time can fill a child's emotional cup for hours.",
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}

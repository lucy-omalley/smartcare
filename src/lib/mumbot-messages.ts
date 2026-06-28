export function generateWelcomeMessage(name?: string | null): string {
  const greeting = name ? `Hi ${name.split(" ")[0]} 👋` : "Hi there 👋";
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

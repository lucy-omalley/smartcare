/** Short focus tips for the 30% personalised section (goals & challenges). */

export const GOAL_FOCUS_TIPS: Record<string, string> = {
  "Better bedtime": "Start bedtime 15 minutes earlier tonight.",
  "Better naps": "Keep nap time consistent, even on weekends.",
  "Morning routine": "Pick one morning step to repeat daily.",
  "Daily routine": "Use a simple visual schedule for today.",
  "Independent sleeping": "Try a calm wind-down ritual before bed.",
  Tantrums: "Name the feeling before redirecting behaviour.",
  "Hitting / biting": "Stay close and model gentle hands.",
  "Emotional regulation": "Pause and breathe together for 10 seconds.",
  Listening: "Get down to their eye level when you speak.",
  Confidence: "Praise effort, not just results.",
  Sharing: "Practice turn-taking with a favourite toy.",
  "Social skills": "Role-play a friendly hello today.",
  "Picky eating": "Offer one familiar food with one new food.",
  "Healthy recipes": "Add one extra vegetable to lunch.",
  "Lunchbox ideas": "Let your child pick one snack item.",
  "New foods": "Try a tiny taste — no pressure to finish.",
  "Meal planning": "Prep one easy meal component ahead.",
  "Speech & language": "Repeat their words and add one more.",
  Reading: "Read the same book twice — repetition helps.",
  Creativity: "Set out paper and crayons for free drawing.",
  "Early learning": "Count everyday objects during play.",
  "Motor skills": "Try stacking or pouring play today.",
  Milestones: "Celebrate one small step forward.",
  "Indoor activities": "Build a blanket fort for 20 minutes.",
  "Outdoor play": "Spend 15 minutes outside after lunch.",
  "Weekend ideas": "Plan one low-key family outing.",
  "Rainy day ideas": "Try a kitchen dance party.",
  "Screen-free play": "Swap screens for blocks or puzzles.",
  "Reduce stress": "Take five minutes just for you.",
  "Parenting confidence": "You handled something well today.",
  Mindfulness: "Notice three good moments before bed.",
  "Work-life balance": "Protect one small pocket of family time.",
  "Parent check-ins": "Name one win from today out loud.",
  "Meet nearby parents": "Browse Connect for a coffee walk.",
  "Coffee walks": "Set your broad availability for this week.",
  Playdates: "Send one low-pressure Connect hello.",
  "Local family events": "Check upcoming events near you.",
  "Parent support": "Ask MumBot for encouragement anytime.",
  "Daily parenting plan": "Pick one plan item to try today.",
  "MumBot advice": "Ask one specific question tonight.",
  "Bedtime stories": "Read tonight's story together.",
  "Gentle reminders": "Set one small reminder for tomorrow.",
};

export const CHALLENGE_FOCUS_TIPS: Record<string, string> = {
  Sleep: "Dim lights 30 minutes before bed tonight.",
  Tantrums: "Stay calm and wait out the peak together.",
  "Picky eating": "Serve a safe food alongside something new.",
  Activities: "Try one 10-minute play idea from Today's Plan.",
  Speech: "Pause after speaking — give them time to respond.",
  Behaviour: "Praise the behaviour you want to see more of.",
  "Toilet training": "Keep routines calm and consistent today.",
  "Meeting other parents": "Browse Connect — broad area only.",
  "Feeling overwhelmed": "Lower the bar — one thing is enough.",
  "Development concerns": "Try today's milestone tip together.",
  "Not sure": "Pick one small focus for the week ahead.",
};

export interface FocusCardData {
  type: "goal" | "challenge";
  title: string;
  tip: string;
  mumbotPrompt: string;
}

export function buildFocusCards(
  parentingGoals: string[],
  currentChallenges: string[],
  priorityGoal?: string | null
): FocusCardData[] {
  const cards: FocusCardData[] = [];

  if (priorityGoal) {
    cards.push({
      type: "goal",
      title: priorityGoal,
      tip: GOAL_FOCUS_TIPS[priorityGoal] ?? "Take one small step toward this goal today.",
      mumbotPrompt: `Help me with my priority goal: ${priorityGoal}. What's one thing I can try today?`,
    });
  } else if (parentingGoals.length > 0) {
    const goal = parentingGoals[0];
    cards.push({
      type: "goal",
      title: goal,
      tip: GOAL_FOCUS_TIPS[goal] ?? "Take one small step toward this goal today.",
      mumbotPrompt: `Help me with: ${goal}. What's one thing I can try today?`,
    });
  }

  if (cards.length < 2 && currentChallenges.length > 0) {
    const challenge = currentChallenges[0];
    cards.push({
      type: "challenge",
      title: challenge,
      tip: CHALLENGE_FOCUS_TIPS[challenge] ?? "You're not alone — small steps add up.",
      mumbotPrompt: `I'm struggling with ${challenge.toLowerCase()}. Can you give me practical advice?`,
    });
  }

  return cards.slice(0, 2);
}

/** Truncate to ~15 words for compact card display. */
export function truncateWords(text: string, maxWords = 15): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(" ")}…`;
}

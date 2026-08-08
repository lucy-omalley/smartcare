import { PrismaClient } from "@prisma/client";
import {
  buildActivitiesFromRotate,
  buildRecipesFromRotate,
  buildStoriesFromRotate,
  buildTipsFromLanguageAlternates,
} from "./seed-data/from-rotate";
import {
  extraActivities,
  extraBooks,
  extraGames,
  extraMilestones,
  extraRecipes,
  extraSongs,
  extraTips,
  seedArticles,
  seedFaqs,
  weeklyThemes,
} from "./seed-data/extras";

const prisma = new PrismaClient();

async function upsertAll<T extends { slug: string }>(
  label: string,
  items: T[],
  upsert: (item: T) => Promise<unknown>
) {
  for (const item of items) {
    await upsert(item);
  }
  console.log(`  ${label}: ${items.length}`);
}

/** Seed structured knowledge — AI selects from this, never invents from scratch */
export async function seedKnowledgeBase() {
  const recipes = [...buildRecipesFromRotate(), ...extraRecipes];
  const activities = [...buildActivitiesFromRotate(), ...extraActivities];
  const stories = buildStoriesFromRotate();
  const tips = [...buildTipsFromLanguageAlternates(), ...extraTips];

  await upsertAll("recipes", recipes, (r) =>
    prisma.knowledgeRecipe.upsert({ where: { slug: r.slug }, create: r, update: r })
  );
  await upsertAll("activities", activities, (a) =>
    prisma.knowledgeActivity.upsert({ where: { slug: a.slug }, create: a, update: a })
  );
  await upsertAll("stories", stories, (s) =>
    prisma.knowledgeStory.upsert({ where: { slug: s.slug }, create: s, update: s })
  );
  await upsertAll("tips", tips, (t) =>
    prisma.knowledgeTip.upsert({ where: { slug: t.slug }, create: t, update: t })
  );
  await upsertAll("milestones", extraMilestones, (m) =>
    prisma.knowledgeMilestone.upsert({ where: { slug: m.slug }, create: m, update: m })
  );
  await upsertAll("books", extraBooks, (b) =>
    prisma.knowledgeBook.upsert({ where: { slug: b.slug }, create: b, update: b })
  );
  await upsertAll("songs", extraSongs, (s) =>
    prisma.knowledgeSong.upsert({ where: { slug: s.slug }, create: s, update: s })
  );
  await upsertAll("games", extraGames, (g) =>
    prisma.knowledgeGame.upsert({ where: { slug: g.slug }, create: g, update: g })
  );
  await upsertAll("weekly themes", weeklyThemes, (w) =>
    prisma.knowledgeWeeklyTheme.upsert({ where: { slug: w.slug }, create: w, update: w })
  );
  await upsertAll("FAQs", seedFaqs, (f) =>
    prisma.knowledgeFaq.upsert({ where: { slug: f.slug }, create: f, update: f })
  );
  await upsertAll("articles", seedArticles, (a) =>
    prisma.knowledgeArticle.upsert({ where: { slug: a.slug }, create: a, update: a })
  );

  const total =
    recipes.length +
    activities.length +
    stories.length +
    tips.length +
    extraMilestones.length +
    extraBooks.length +
    extraSongs.length +
    extraGames.length +
    weeklyThemes.length +
    seedFaqs.length +
    seedArticles.length;

  console.log(`Knowledge base seeded (${total} items).`);
}

if (require.main === module) {
  seedKnowledgeBase()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}

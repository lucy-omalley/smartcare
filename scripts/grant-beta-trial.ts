/**
 * Grant 30-day beta Premium trial to existing users without an active trial.
 *
 *   npx ts-node scripts/grant-beta-trial.ts           # preview
 *   npx ts-node scripts/grant-beta-trial.ts --execute
 */

import { PrismaClient } from "@prisma/client";

const BETA_TRIAL_DAYS = 30;
const execute = process.argv.includes("--execute");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [{ betaTrialEndsAt: null }, { betaTrialEndsAt: { lt: new Date() } }],
      planTier: "FREE",
    },
    select: { id: true, email: true, betaTrialEndsAt: true },
  });

  console.log(`${execute ? "Will grant" : "Would grant"} trial to ${users.length} user(s)`);
  for (const u of users.slice(0, 20)) {
    console.log(`  - ${u.email}`);
  }
  if (users.length > 20) console.log(`  ... and ${users.length - 20} more`);

  if (!execute) {
    console.log("\nDry run. Pass --execute to apply.");
    return;
  }

  const ends = new Date();
  ends.setUTCDate(ends.getUTCDate() + BETA_TRIAL_DAYS);

  const result = await prisma.user.updateMany({
    where: {
      id: { in: users.map((u) => u.id) },
    },
    data: {
      betaTrialEndsAt: ends,
      subscriptionStatus: "TRIALING",
    },
  });

  console.log(`\nUpdated ${result.count} user(s). Trial ends ${ends.toISOString()}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

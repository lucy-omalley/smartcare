/**
 * Grandfather existing users before email verification rollout.
 * Sets emailVerified for accounts that registered before the feature shipped.
 *
 * Usage:
 *   npx ts-node scripts/grant-existing-email-verified.ts           # preview
 *   npx ts-node scripts/grant-existing-email-verified.ts --execute # apply
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const execute = process.argv.includes("--execute");

async function main() {
  const unverified = await prisma.user.findMany({
    where: { emailVerified: null },
    select: { id: true, email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  if (unverified.length === 0) {
    console.log("No users with null emailVerified.");
    return;
  }

  console.log(`${execute ? "Will verify" : "Would verify"} ${unverified.length} user(s):`);
  for (const user of unverified) {
    console.log(`  - ${user.email} (created ${user.createdAt.toISOString()})`);
  }

  if (!execute) {
    console.log("\nDry run. Pass --execute to update emailVerified.");
    return;
  }

  const result = await prisma.user.updateMany({
    where: { emailVerified: null },
    data: { emailVerified: new Date() },
  });

  console.log(`\nUpdated ${result.count} user(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

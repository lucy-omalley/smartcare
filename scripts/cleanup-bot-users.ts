/**
 * Remove bot/spam registration accounts (dry-run by default).
 *
 * Usage:
 *   npx ts-node scripts/cleanup-bot-users.ts           # preview only
 *   npx ts-node scripts/cleanup-bot-users.ts --execute # delete accounts
 *
 * Protected: isAdmin, onboarded, lastActiveAt, lastLoginAt, childBirthday set.
 */

import { PrismaClient } from "@prisma/client";

// Inline bot detection (scripts cannot import @/ paths without extra config)
function looksLikeBotRegistration(name: string, email: string): boolean {
  const trimmedName = name.trim();
  const lowerEmail = email.trim().toLowerCase();
  if (lowerEmail.endsWith("@example.com")) return true;
  if (/^[a-zA-Z]{15,25}$/.test(trimmedName)) {
    const upper = (trimmedName.match(/[A-Z]/g) ?? []).length;
    const lower = (trimmedName.match(/[a-z]/g) ?? []).length;
    if (upper >= 3 && lower >= 3) return true;
  }
  const local = lowerEmail.split("@")[0] ?? "";
  if (lowerEmail.endsWith("@gmail.com") && (local.match(/\./g) ?? []).length >= 3) return true;
  return false;
}

function isSafeBotCleanupCandidate(user: {
  name: string;
  email: string;
  onboardingComplete: boolean;
  isAdmin: boolean;
  lastActiveAt: Date | null;
  lastLoginAt: Date | null;
  childBirthday: string | null;
}): boolean {
  if (user.isAdmin) return false;
  if (user.onboardingComplete) return false;
  if (user.lastActiveAt) return false;
  if (user.lastLoginAt) return false;
  if (user.childBirthday) return false;
  return looksLikeBotRegistration(user.name, user.email);
}

const execute = process.argv.includes("--execute");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      onboardingComplete: true,
      isAdmin: true,
      lastActiveAt: true,
      lastLoginAt: true,
      childBirthday: true,
    },
  });

  const toDelete = users.filter(isSafeBotCleanupCandidate);
  const kept = users.length - toDelete.length;

  console.log(`\nTotal users: ${users.length}`);
  console.log(`Candidates for removal: ${toDelete.length}`);
  console.log(`Will remain: ${kept}`);
  console.log(`Mode: ${execute ? "EXECUTE (deleting)" : "DRY RUN (preview only)"}\n`);

  if (toDelete.length === 0) {
    console.log("Nothing to clean up.");
    return;
  }

  console.log("Accounts to remove:");
  toDelete.forEach((u) => {
    console.log(`  ${u.createdAt.toISOString().slice(0, 10)} | ${u.email} | ${u.name}`);
  });

  if (!execute) {
    console.log("\nRun with --execute to delete these accounts.");
    return;
  }

  let deleted = 0;
  let failed = 0;
  for (const user of toDelete) {
    try {
      await prisma.user.delete({ where: { id: user.id } });
      deleted += 1;
    } catch (err) {
      failed += 1;
      console.error(`Failed to delete ${user.email}:`, err);
    }
  }

  console.log(`\nDeleted: ${deleted}, Failed: ${failed}`);
  console.log(`Remaining users: ${await prisma.user.count()}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

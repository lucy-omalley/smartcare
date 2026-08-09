/**
 * Grant isAdmin (unlimited AI usage) to a user by email.
 * Usage: npx ts-node scripts/set-admin.ts yuzhuoli@hotmail.com
 */
import { PrismaClient } from "@prisma/client";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: npx ts-node scripts/set-admin.ts <email>");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.update({
    where: { email },
    data: { isAdmin: true },
    select: { id: true, email: true, isAdmin: true, planTier: true },
  });
  console.log("Admin enabled:", user);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

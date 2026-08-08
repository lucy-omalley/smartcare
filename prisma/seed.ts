import { PrismaClient } from '@prisma/client';
import { seedKnowledgeBase } from './seed-knowledge';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Parenfy knowledge base…');
  await seedKnowledgeBase();
  console.log('Database ready.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

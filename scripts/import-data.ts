import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function importData() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const usersPath = path.join(dataDir, 'users.json');

    if (!fs.existsSync(usersPath)) {
      console.log('No users.json found — skipping import.');
      return;
    }

    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
    for (const user of usersData) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user,
      });
    }
    console.log(`Imported ${usersData.length} users`);

    console.log('Data import completed successfully!');
  } catch (error) {
    console.error('Error importing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importData();

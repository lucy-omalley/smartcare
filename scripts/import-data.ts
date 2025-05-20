import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function importData() {
  try {
    const dataDir = path.join(process.cwd(), 'data');

    // Import Providers
    const providersData = JSON.parse(
      fs.readFileSync(path.join(dataDir, 'providers.json'), 'utf-8')
    );
    for (const provider of providersData) {
      await prisma.provider.upsert({
        where: { id: provider.id },
        update: provider,
        create: provider,
      });
    }
    console.log(`Imported ${providersData.length} providers`);

    // Import Users
    const usersData = JSON.parse(
      fs.readFileSync(path.join(dataDir, 'users.json'), 'utf-8')
    );
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
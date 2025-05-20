import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportData() {
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }

    // Export Providers
    const providers = await prisma.provider.findMany();
    fs.writeFileSync(
      path.join(dataDir, 'providers.json'),
      JSON.stringify(providers, null, 2)
    );
    console.log(`Exported ${providers.length} providers`);

    // Export Users
    const users = await prisma.user.findMany();
    fs.writeFileSync(
      path.join(dataDir, 'users.json'),
      JSON.stringify(users, null, 2)
    );
    console.log(`Exported ${users.length} users`);

    console.log('Data export completed successfully!');
  } catch (error) {
    console.error('Error exporting data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData(); 
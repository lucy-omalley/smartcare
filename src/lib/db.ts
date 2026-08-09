import { PrismaClient } from '@prisma/client';
import { getDatabaseUrl, withDbRetry } from './db-url';

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: { url: getDatabaseUrl() },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
};

export const prisma = global.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/** Lightweight connectivity check — serverless-safe, retries Neon wake-up. */
export async function checkDatabaseConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    await withDbRetry(() => prisma.$queryRaw`SELECT 1`);
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Database connectivity check failed:', message);
    return { ok: false, error: message };
  }
}

export { withDbRetry } from './db-url';

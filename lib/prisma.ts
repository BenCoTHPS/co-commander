// 1. Import from the new custom output path, NOT @prisma/client
import { PrismaClient } from '../generated/prisma/client/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

// 2. We pass the raw string directly. In production, your Electron main.js will overwrite this dynamically.
const connectionString = process.env.DATABASE_URL || 'file:./prisma/dev.db';

// 3. The adapter now takes a simple configuration object with the url
const adapter = new PrismaBetterSqlite3({
  url: connectionString,
});

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ['query', 'info', 'warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
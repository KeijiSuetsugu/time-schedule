import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prismaクライアントの初期化
console.log('Initializing Prisma Client...');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('POSTGRES_PRISMA_URL exists:', !!process.env.POSTGRES_PRISMA_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Vercelの場合はPOSTGRES_PRISMA_URLを優先
const databaseUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;


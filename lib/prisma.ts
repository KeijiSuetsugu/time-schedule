import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  // 環境変数を確認（Vercelでは複数の可能性がある）
  const databaseUrl = 
    process.env.PRISMA_DATABASE_URL || 
    process.env.POSTGRES_PRISMA_URL || 
    process.env.DATABASE_URL;

  console.log('Database URL exists:', !!databaseUrl);
  console.log('Environment:', process.env.NODE_ENV);

  if (!databaseUrl) {
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('PRISMA')));
    throw new Error('PRISMA_DATABASE_URL is not set');
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export { prisma };
export default prisma;

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}


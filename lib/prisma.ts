import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  const databaseUrl = process.env.PRISMA_DATABASE_URL;

  if (!databaseUrl) {
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

export default prisma;

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}


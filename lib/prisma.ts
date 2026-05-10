import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function withPoolOptions(databaseUrl: string | undefined) {
  if (!databaseUrl) return undefined;

  const url = new URL(databaseUrl);
  if (!url.searchParams.has('connection_limit')) {
    url.searchParams.set('connection_limit', '3');
  }
  if (!url.searchParams.has('pool_timeout')) {
    url.searchParams.set('pool_timeout', '30');
  }
  if (!url.searchParams.has('connect_timeout')) {
    url.searchParams.set('connect_timeout', '10');
  }

  return url.toString();
}

const connectionString = withPoolOptions(process.env.DATABASE_URL);

const prisma = connectionString
  ? global.prisma || new PrismaClient({
      log: process.env.DEBUG_PRISMA_QUERIES === 'true' ? ['query', 'error', 'warn'] : ['error', 'warn'],
      datasources: {
        db: {
          url: connectionString,
        },
      },
    })
  : undefined;

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma as PrismaClient;

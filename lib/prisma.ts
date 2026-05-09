import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Add connection pool configuration to prevent timeouts
const connectionString = process.env.DATABASE_URL 
  ? process.env.DATABASE_URL.includes('connection_limit') 
    ? process.env.DATABASE_URL 
    : `${process.env.DATABASE_URL}?connection_limit=10&pool_timeout=20`
  : undefined;

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

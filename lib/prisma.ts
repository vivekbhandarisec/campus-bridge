import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = process.env.DATABASE_URL
  ? global.prisma || new PrismaClient()
  : undefined;

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma as PrismaClient;

import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// In development, always create a new client to pick up env changes
export const prisma = process.env.NODE_ENV === 'production' 
  ? (global.prisma || new PrismaClient({
      log: ['error'],
    }))
  : new PrismaClient({
      log: ['query', 'error', 'warn'],
    });

if (process.env.NODE_ENV === 'production') {
  global.prisma = prisma;
}

export default prisma;

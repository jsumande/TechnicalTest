import { PrismaClient } from '@prisma/client';

/**
 * Prisma client singleton.
 *
 * In development, Next.js / ts-node can hot-reload modules, which would
 * normally create a new PrismaClient instance on every reload and
 * exhaust the database connection pool.
 *
 * This pattern stores the client on the global object so it survives
 * hot reloads (in development) while still creating a fresh instance in
 * production where the module is only loaded once.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

// Persist the client between hot reloads in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

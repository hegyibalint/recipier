import type { inferAsyncReturnType } from '@trpc/server';
import { PrismaClient } from '@prisma/client';

export function createContext() {
  const prisma = new PrismaClient();

  return {
    prisma
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;

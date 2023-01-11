import { procedure, router } from '../trpc';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const client = new PrismaClient();

export const mealtimeRouter = router({
  list: procedure.query(() =>
    client.mealtime.findMany({
      orderBy: {
        order: 'asc',
      },
    })
  ),
  get: procedure.input(z.number()).query(({ input }) =>
    client.mealtime.findUnique({
      where: {
        id: input,
      },
    })
  ),
});

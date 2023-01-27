import { PrismaClient } from '@prisma/client';
import { publicProcedure, router } from '../trpc';

const client = new PrismaClient();

export const mealtimesRouter = router({
  list: publicProcedure.query(() => client.mealtime.findMany())
});

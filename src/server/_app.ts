import { mealsRouter } from './router/meals';
import { mealtimesRouter } from './router/mealtimes';
import { publicProcedure, router } from './trpc';

export const appRouter = router({
  greeting: publicProcedure.query(() => 'hello tRPC v10!'),
  meals: mealsRouter,
  mealtimes: mealtimesRouter
});
export type AppRouter = typeof appRouter;

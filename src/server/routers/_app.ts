import { router } from '../trpc';
import { mealsRouter } from './meals';
import { mealtimeRouter } from './mealtime';

export const appRouter = router({
  meals: mealsRouter,
  mealtimes: mealtimeRouter,
});

export type AppRouter = typeof appRouter;

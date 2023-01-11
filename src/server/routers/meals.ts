import { z } from 'zod';
import { procedure, router } from '../trpc';
import { PrismaClient } from '@prisma/client';

const client = new PrismaClient();

async function queryMeals(from: string, to: string) {
  const meals = await client.meal.findMany({
    where: {
      date: {
        gte: from,
        lte: to,
      },
    },
  });

  return {
    meals: meals,
    mealtimes: await client.mealtime.findMany(),
    recipes: await client.recipe.findMany({
      where: {
        id: {
          in: meals.map((meal) => meal.recipeId),
        },
      },
    }),
  };
}

export const mealsRouter = router({
  list: procedure.query(() => client.meal.findMany()),
  listForDate: procedure.input(z.string()).query(({ input }) =>
    client.meal.findMany({
      where: {
        date: input,
      },
    })
  ),
  query: procedure
    .input(
      z.object({
        from: z.string(),
        to: z.string(),
      })
    )
    .query(({ input }) => queryMeals(input.from, input.to)),
});

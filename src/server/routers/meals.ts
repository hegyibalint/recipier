import { z } from 'zod';
import { procedure, router } from '../trpc';
import { Prisma, PrismaClient } from '@prisma/client';

const client = new PrismaClient();

async function queryMeals(query: Prisma.MealWhereInput) {
  const meals = await client.meal.findMany({
    where: query,
    select: {
      recipeId: true,
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
    queryMeals({
      date: {
        equals: input,
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
    .query(({ input }) =>
      queryMeals({
        date: {
          gte: input.from,
          lte: input.to,
        },
      })
    ),
});

import { z } from 'zod';
import { Prisma, PrismaClient } from '@prisma/client';
import { router, publicProcedure } from '../trpc';

const client = new PrismaClient();

async function queryMeals(query: Prisma.MealWhereInput) {
  const meals = await client.meal.findMany({
    where: query,
    select: {
      recipeId: true
    }
  });

  return {
    meals: meals,
    recipes: await client.recipe.findMany({
      where: {
        id: {
          in: meals.map((meal) => meal.recipeId)
        }
      }
    })
  };
}

export const mealsRouter = router({
  list: publicProcedure.query(() => client.meal.findMany()),
  listForDate: publicProcedure.input(z.string()).query(({ input }) =>
    queryMeals({
      date: {
        equals: input
      }
    })
  ),
  query: publicProcedure
    .input(
      z.object({
        from: z.string(),
        to: z.string()
      })
    )
    .query(({ input }) =>
      queryMeals({
        date: {
          gte: input.from,
          lte: input.to
        }
      })
    )
});

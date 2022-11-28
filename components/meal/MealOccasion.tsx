import { Mealtime, PrismaClient } from '@prisma/client';
import Link from 'next/link';

const client = new PrismaClient();

async function getMeals(date: Date, mealtime: Mealtime) {
  return await client.meal.findMany({
    select: {
      recipe: true,
    },
    where: {
      date: {
        equals: date,
      },
      mealtimeId: {
        equals: mealtime.id,
      },
    },
    orderBy: {
      recipeId: 'asc',
    },
  });
}

interface MealOccasionProps {
  date: Date;
  mealtime: Mealtime;
}

export default async function MealOccasion(props: MealOccasionProps) {
  const meals = await getMeals(props.date, props.mealtime);

  return (
    <div className="m-1 p-1 border-dotted border-2 border-black">
      <p>{props.mealtime.name}</p>
      <div className="flex flex-col">
        {meals.map((meal) => (
          <p key={meal.recipe.id}>{meal.recipe.name}</p>
        ))}
      </div>
      <Link
        href={{
          pathname: '/meal/add/',
          query: {
            date: props.date.toISOString(),
            mealtimeId: props.mealtime.id,
          },
        }}
      >
        <p className="bg-red-500">{`Add ${
          meals.length == 0 ? 'meal' : 'another'
        }`}</p>
      </Link>
    </div>
  );
}

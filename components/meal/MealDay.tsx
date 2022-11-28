import { Meal, Mealtime, PrismaClient } from '@prisma/client';
import { format, isToday } from 'date-fns';
import MealOccasion from './MealOccasion';

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

async function renderMealtimes(date: Date, mealtime: Mealtime) {
  console.log(mealtime.id);
  const meals = await getMeals(date, mealtime);

  return (
    <div key={mealtime.id}>
      <p>{mealtime.name}</p>
      {meals.map((meal) => (
        <p key={date.toISOString()}>{meal.recipe.name}</p>
      ))}
    </div>
  );
}

export interface MealDayProps {
  date: Date;
  mealtimes: Mealtime[];
}

export default async function MealDay(props: MealDayProps) {
  const dayName = format(props.date, 'EEEE');
  const formatterDate = format(props.date, 'MMM dd');

  return (
    <div
      className="flex-grow p-2 border-2 border-gray-500 shadow-sm"
      key={dayName.toLowerCase()}
    >
      <p
        className={`text-center text-2xl ${
          isToday(props.date) ? 'underline font-extrabold' : ''
        }`}
      >
        {dayName}
      </p>
      <p className="text-center">{formatterDate}</p>
      <hr className="border-black mt-2 mb-4" />
      <div>
        {props.mealtimes.map((mealtime) => (
          /* @ts-expect-error Server Component */
          <MealOccasion
            key={props.date.getTime()}
            date={props.date}
            mealtime={mealtime}
          />
        ))}
      </div>
    </div>
  );
}

import { useRouter } from 'next/router';
import { trpc } from '../../utils/trpc';
import { Meal, Mealtime, Recipe } from "@prisma/client";
import { format, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';

interface MealtimeProps {
  mealtime: Mealtime;
  recipes: Recipe[];
}

function Mealtime(props: MealtimeProps) {
  return (
    <div className="w-full flex flex-row border-b-2 border-dashed border-gray-500">
      <div className="border-r-4 border-r-primary px-2 py-6 [writing-mode:vertical-rl]">
        <p className="text-2xl rotate-180">{props.mealtime.name}</p>
      </div>
      <div className="flex-grow">
        {props.recipes.map(meal => meal.)}
      </div>
    </div>
  );
}

export default function MealPage() {
  const router = useRouter();
  const date = router.query.id as string;

  const [formattedTime, setFormattedTime] = useState('?');

  const mealtimesQuery = trpc.mealtimes.list.useQuery();
  const mealtimes = mealtimesQuery.data || [];

  const mealsQuery = trpc.meals.listForDate.useQuery(date);
  const recipes = mealsQuery.data || [];

  useEffect(() => {
    if (router.isReady) {
      const formattedTime = format(parseISO(date), 'MMM dd');
      setFormattedTime(formattedTime);
    }
  }, [router.isReady, date]);

  return (
    <div className="flex-grow flex flex-col p-4 container mx-auto">
      <div className="w-full text-center">
        <h1 className="text-2xl">~ Meals &ndash; {formattedTime} ~</h1>
      </div>

      {mealtimes.map((mealtime) => (
        <Mealtime key={mealtime.id} mealtime={mealtime} recipes={recipes.filter((meal) => meal.mealtimeId === mealtime.id)} />
      ))}
    </div>
  );
}

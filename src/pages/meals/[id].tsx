import { useRouter } from 'next/router';
import { trpc } from '../../utils/trpc';
import { Mealtime } from '@prisma/client';

interface MealtimeProps {
  mealtime: Mealtime;
}

function Mealtime(props: MealtimeProps) {
  return (
    <div className="flex flex-row">
      <div className="border-2 border-r-8 border-gray-500 border-r-primary p-2 [writing-mode:vertical-rl]">
        <p className="text-2xl rotate-180">{props.mealtime.name}</p>
      </div>
      <div className="flex-grow">
        <p>Rest</p>
      </div>
    </div>
  );
}

export default function MealPage() {
  const router = useRouter();

  const mealtimeQuery = trpc.mealtimes.list.useQuery();
  const mealtimes = mealtimeQuery.data || [];

  const mealsQuery = trpc.meals.listForDate.useQuery(router.query.id as string);
  const meals = mealsQuery.data || [];

  return (
    <div className="flex-grow flex flex-col p-4 gap-2 container mx-auto">
      {mealtimes.map((mealtime) => (
        <Mealtime key={mealtime.id} mealtime={mealtime} />
      ))}
    </div>
  );
}

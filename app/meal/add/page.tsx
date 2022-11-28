import { PrismaClient } from '@prisma/client';
import { format, parseISO } from 'date-fns';
import RecipeSearch from '../../../components/recipe/RecipeSearch';

const client = new PrismaClient();

async function getMealtime(mealtimeId: number) {
  return await client.mealtime.findUnique({
    where: {
      id: mealtimeId,
    },
  });
}

export default async function MealAddPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { date: string; mealtimeId: string; search?: string };
}) {
  const parsedDate = parseISO(searchParams.date);
  const mealtime = await getMealtime(Number.parseInt(searchParams.mealtimeId));

  return (
    <main className="flex-grow flex flex-col items-center container mx-auto">
      <p className="m-2 text-2xl">
        <span className="font-bold">{format(parsedDate, 'MMM dd')}</span>
        <span> - </span>
        <span>{mealtime?.name}</span>
      </p>
      <RecipeSearch />
    </main>
  );
}

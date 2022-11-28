import { parseISO } from 'date-fns';
import MealCalendar from '../components/meal/MealCalendar';

export default async function HomePage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { d: string };
}) {
  const date = searchParams['d'] ? parseISO(searchParams['d']) : new Date();

  return (
    <main className="flex-grow flex flex-col container mx-auto">
      {/* @ts-expect-error Server Component */}
      <MealCalendar date={date} />
    </main>
  );
}

import { Meal, Mealtime, PrismaClient, Recipe } from '@prisma/client';
import { format, isToday } from 'date-fns';

export interface MealDayProps {
  date: Date;
  meals: Meal[];
  recipes?: Recipe[];
  mealtimes?: Mealtime[];
}

export default function MealDay(props: MealDayProps) {
  const dayName = format(props.date, 'EEEE');
  const formatterDate = format(props.date, 'MMM dd');

  return (
    <div className="flex-grow p-2 border-2 border-gray-500 shadow-sm" key={dayName.toLowerCase()}>
      <p className={`text-center text-2xl ${isToday(props.date) ? 'underline font-extrabold' : ''}`}>{dayName}</p>
      <p className="text-center">{formatterDate}</p>
      <hr className="border-black mt-2 mb-4" />
      <div></div>
    </div>
  );
}

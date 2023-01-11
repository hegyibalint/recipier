import { addWeeks, endOfWeek, startOfWeek, subWeeks } from 'date-fns';
import MealCalendar from '../components/index/MealCalendar';
import { useState } from 'react';
import ShoppingList from '../components/index/ShoppingList';

export default function HomePage() {
  const [fromDate, setFromDate] = useState(startOfWeek(new Date()));
  const toDate = endOfWeek(fromDate);

  const onPageLeft = () => {
    setFromDate(subWeeks(fromDate, 1));
  };
  const onPageRight = () => {
    setFromDate(addWeeks(fromDate, 1));
  };
  const onHome = () => {
    setFromDate(startOfWeek(new Date()));
  };

  return (
    <main className="flex-grow flex flex-col gap-4 content-center text-center container mx-auto">
      <MealCalendar fromDate={fromDate} toDate={toDate} onPageLeft={onPageLeft} onPageRight={onPageRight} onHome={onHome} />
      <ShoppingList />
    </main>
  );
}

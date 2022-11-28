import { Mealtime, PrismaClient } from '@prisma/client';
import {
  startOfWeek,
  addWeeks,
  subWeeks,
  differenceInCalendarWeeks,
  endOfWeek,
  eachDayOfInterval,
} from 'date-fns';
import Link from 'next/link';
import PagerButton from '../PagerButton';
import MealDay from './MealDay';

const prisma = new PrismaClient();

function renderWeek(startDay: Date, mealtimes: Mealtime[]) {
  const days = eachDayOfInterval({
    start: startOfWeek(startDay),
    end: endOfWeek(startDay),
  });

  return days.map((day) => {
    /* @ts-expect-error Server Component */ /* @ts-expect-error Server Component */
    return <MealDay key={day.getDate()} date={day} mealtimes={mealtimes} />;
  });
}

function renderTimeDistance(startDay: Date) {
  const formatDiff = (diff: number) => {
    if (diff == 0) return 'This week';
    else if (diff == -1) return 'Previous week';
    else if (diff == +1) return 'Next week';
    else if (diff < -1) return `${Math.abs(diff)} weeks before`;
    else return `${diff} weeks ahead`;
  };
  const weekDifference = differenceInCalendarWeeks(startDay, new Date());
  return formatDiff(weekDifference);
}

async function getMealtimes() {
  return await prisma.mealtime.findMany({
    orderBy: {
      order: 'asc',
    },
  });
}

interface MealCalendarProps {
  date: Date;
}

export default async function MealCalendar(props: MealCalendarProps) {
  const mealtimes = await getMealtimes();

  return (
    <div className="flex flex-col items-center gap-2 mt-2">
      <p className="text-2xl">Meals - {renderTimeDistance(props.date)}</p>
      <div className="w-full flex gap-2">
        <Link
          href={{
            pathname: '/',
            query: { d: subWeeks(props.date, 1).toISOString() },
          }}
        >
          <PagerButton direction="LEFT" />
        </Link>
        {renderWeek(props.date, mealtimes)}
        <Link
          href={{
            pathname: '/',
            query: { d: addWeeks(props.date, 1).toISOString() },
          }}
        >
          <PagerButton direction="RIGHT" />
        </Link>
      </div>
    </div>
  );
}

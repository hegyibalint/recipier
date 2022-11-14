'use client';

import {
  format,
  startOfWeek,
  addWeeks,
  subWeeks,
  isBefore,
  isToday,
  isThisYear,
  differenceInCalendarWeeks,
  endOfWeek,
  eachDayOfInterval,
} from 'date-fns';
import { addDays } from 'date-fns/esm';
import { Dispatch, Fragment, SetStateAction, use, useState } from 'react';
import PagerButton from './PagerButton';

enum DisplayMode {
  WEEK,
  MONTH,
}

function renderMeal(meal: string) {
  return (
    <div
      className="m-2 p-2 p- border-2 border-gray-500 border-dashed rounded-xl select-none cursor-pointer hover:bg-slate-100"
      key={meal.toLowerCase()}
    >
      <p className="text-center">{meal}</p>
    </div>
  );
}

function renderDay(day: Date) {
  const dayName = format(day, 'EEEE');
  const dateFormat = isThisYear(day) ? 'MMM dd' : 'uuuu MMM dd';
  const date = format(day, dateFormat);

  const meals = ['Breakfast', 'Lunch', 'Dinner'];

  return (
    <div
      className="flex-grow p-2 border-2 border-gray-500 shadow-sm"
      key={dayName.toLowerCase()}
    >
      <p
        className={`text-center text-2xl ${
          isToday(day) ? 'underline font-extrabold' : ''
        }`}
      >
        {dayName}
      </p>
      <p className="text-center">{date}</p>
      <hr className="border-black mt-2 mb-4" />
      <div>{meals.map((meal) => renderMeal(meal))}</div>
    </div>
  );
}

function* renderWeek(startDay: Date) {
  const nextWeek = addWeeks(startDay, 1);
  const days = eachDayOfInterval({
    start: startOfWeek(startDay),
    end: endOfWeek(startDay),
  });

  for (let i = startDay; isBefore(i, nextWeek); i = addDays(i, 1)) {
    yield renderDay(i);
  }
}

function renderCalendar(
  startDay: Date,
  setStartDay: Dispatch<SetStateAction<Date>>
) {
  const addWeekAction = () => {
    setStartDay(addWeeks(startDay, 1));
  };

  const subWeekAction = () => {
    setStartDay(subWeeks(startDay, 1));
  };

  return (
    <Fragment>
      <PagerButton direction="LEFT" onClick={subWeekAction} />
      {[...renderWeek(startDay)]}
      <PagerButton direction="RIGHT" onClick={addWeekAction} />
    </Fragment>
  );
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
  return <p>(&thinsp;{formatDiff(weekDifference)}&thinsp;)</p>;
}

async function getData(startDay: Date) {
  const endDay = endOfWeek(startDay);

  const res = await fetch(
    `http://localhost:3000/api/meals?from=${startDay}&to=${endDay}`
  );
  return res.json();
}

export default function MealCalendar() {
  const [startDay, setStartDay] = useState(startOfWeek(Date.now()));
  const meals = use(getData(startDay));

  return (
    <div className="px-6 pb-6 border-b border-black">
      <div className="flex flex-col items-center m-2">
        <p className="font-bold text-2xl">Meal Calendar</p>
        <p className="text-xl">{renderTimeDistance(startDay)}</p>
      </div>
      <div className="flex flex-col md:flex-row flex-wrap w-full gap-6">
        {renderCalendar(startDay, setStartDay)}
      </div>
    </div>
  );
}

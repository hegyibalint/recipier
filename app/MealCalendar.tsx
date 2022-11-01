"use client";

import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  isSameDay,
  isBefore,
} from "date-fns";
import { addDays } from "date-fns/esm";
import next from "next";
import { Dispatch, Fragment, SetStateAction, useState } from "react";

enum DisplayMode {
  WEEK,
  MONTH,
}

function renderMeal(meal: string) {
  return (
    <div
      className="m-2 p-2 border-2 border-gray-500 border-dashed rounded-xl select-none cursor-pointer hover:bg-slate-100"
      key={meal.toLowerCase()}
    >
      <p className="text-center">{meal}</p>
    </div>
  );
}

function renderDay(day: Date) {
  const dayName = format(day, "EEEE");
  const date = format(day, "MMM dd");

  const meals = ["Breakfast", "Lunch", "Dinner"];

  return (
    <div
      className="flex-grow p-2 bg-white border-2 border-gray-500 shadow-sm"
      key={dayName.toLowerCase()}
    >
      <p className="text-center text-xl">{dayName}</p>
      <p className="text-center">{date}</p>
      <hr className="border-black mt-2 mb-4" />
      <div>{meals.map((meal) => renderMeal(meal))}</div>
    </div>
  );
}

function* renderWeek(startDay: Date) {
  const nextWeek = addWeeks(startDay, 1);

  for (let i = startDay; isBefore(i, nextWeek); i = addDays(i, 1)) {
    yield renderDay(i);
  }
}

function* renderMonth(startDay: Date) {
  return <p>Nope</p>;
}

function renderCalendarDays(displayMode: DisplayMode, startDay: Date) {
  switch (displayMode) {
    case DisplayMode.WEEK:
      return [...renderWeek(startDay)];
    case DisplayMode.MONTH:
      return [...renderMonth(startDay)];
  }
}

function renderCalendar(
  displayMode: DisplayMode,
  startDay: Date,
  setStartDay: Dispatch<SetStateAction<Date>>
) {
  return (
    <Fragment>
      <button className="px-2 bg-primary hover:bg-secondary transition-colors rounded-l-xl">
        <span className="text-4xl text-white">&lt;</span>
      </button>
      {renderCalendarDays(displayMode, startDay)}
      <button className="px-2 bg-primary hover:bg-secondary transition-colors rounded-r-xl">
        <span className="text-4xl text-white">&gt;</span>
      </button>
    </Fragment>
  );
}

function renderModeSelector(
  displayMode: DisplayMode,
  setDisplayMode: Dispatch<SetStateAction<DisplayMode>>
) {
  return (
    <div className="flex-1 flex justify-end items-center">
      <button className="px-2 bg-primary text-white font-bold rounded-l-md border border-primary">
        <span>Week</span>
      </button>
      <button className="px-2 font-bold rounded-r-md border border-primary">
        <span>Month</span>
      </button>
    </div>
  );
}

function renderWeekSelector(
  targetWeek: Date,
  setTargetWeek: Dispatch<SetStateAction<Date>>
) {
  const addWeekAction = () => {
    setTargetWeek(addWeeks(targetWeek, 1));
  };

  const subWeekAction = () => {
    setTargetWeek(subWeeks(targetWeek, 1));
  };

  return (
    <div className="flex-1 flex justify-end items-center">
      <button
        className="bg-primary text-white font-bold rounded-l-md border border-primary"
        onClick={subWeekAction}
      >
        <span className="mx-2">&lt;</span>
      </button>
      <div className="px-2 bg-white border border-primary">
        <span>{format(startOfWeek(targetWeek), "MMM dd")}</span>
        <span> ~ </span>
        <span>{format(endOfWeek(targetWeek), "MMM dd")}</span>
      </div>
      <button
        className="bg-primary text-white font-bold rounded-r-md border border-primary"
        onClick={addWeekAction}
      >
        <span className="mx-2">&gt;</span>
      </button>
    </div>
  );
}

export default function MealCalendar() {
  const [displayMode, setDisplayMode] = useState(DisplayMode.WEEK);
  const [startDay, setStartDay] = useState(startOfWeek(Date.now()));

  return (
    <div className="px-6 pb-6 border-b border-black">
      <div className="flex flex-row w-full">
        <div className="flex-1" />
        <div className="flex-1 flex justify-center items-center">
          <p className="block font-bold text-2xl my-2">Meal Calendar</p>
        </div>
        {renderModeSelector(displayMode, setDisplayMode)}
      </div>
      <div className="flex flex-col md:flex-row flex-wrap w-full gap-6">
        {renderCalendar(displayMode, startDay, setStartDay)}
      </div>
    </div>
  );
}

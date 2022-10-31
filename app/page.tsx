import Backdrop from "../components/Backdrop";
import Container from "../components/Page";
import React, { ReactNode } from "react";

function renderRecepies(): React.ReactNode {
  return (
    <div className=" px-6">
      <p className="font-bold text-2xl text-center my-2">Recepies</p>
    </div>
  );
}

function renderMeal(meal: string) {
  return (
    <div className="m-2 p-2 border-2 border-gray-500 border-dashed rounded-xl select-none cursor-pointer hover:bg-slate-100">
      <p className="text-center">{meal}</p>
    </div>
  );
}

function renderDay(day: string) {
  const meals = ["Breakfast", "Lunch", "Dinner"];

  return (
    <div className="flex-grow p-2 bg-white border-2 border-gray-500 shadow-sm">
      <p className="text-center text-xl">{day}</p>
      <hr className="border-black mt-2 mb-4" />
      <div>{meals.map((meal) => renderMeal(meal))}</div>
    </div>
  );
}

function renderCalendar() {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return (
    <div className="px-6 pb-6 border-b border-black">
      <p className="font-bold text-2xl text-center my-2">Calendar</p>
      <div className="flex flex-col md:flex-row flex-wrap w-full gap-6">
        {days.map((day) => renderDay(day))}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Backdrop>
      <Container>
        <div>{renderCalendar()}</div>
        <div>{renderRecepies()}</div>
      </Container>
    </Backdrop>
  );
}

import React from "react";
import MealCalendar from "../components/MealCalendar";
import RecipeSelector from "../components/RecipeSelector";

export default function Page() {
  return (
    <main className="flex-grow flex flex-col container mx-auto">
      <MealCalendar />
      {/* <RecipeSelector /> */}
    </main>
  );
}

import React from "react";
import MealCalendar from "./MealCalendar";
import RecipeSelector from "./RecipeSelector";
import Header from "./Header";
import Footer from "./Footer";

export default function Page(): React.ReactNode {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex-grow flex flex-col container mx-auto">
        <MealCalendar />
        <RecipeSelector />
      </div>
      <Footer />
    </div>
  );
}

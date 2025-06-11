import { Link, Route, Switch } from "wouter";
import UnitsPage from "@/pages/UnitsPage.tsx";
import UnitPageNew from "@/pages/UnitPageNew.tsx";
import UnitPageExisting from "@/pages/UnitPageExisting.tsx";
import IngredientsPage from "@/pages/IngredientsPage.tsx";
import IngredientPageNew from "@/pages/IngredientPageNew.tsx";
import IngredientPageExisting from "@/pages/IngredientPageExisting.tsx";

const Sidebar = () => {
  return (
    <nav className="h-dvh bg-red-400 flex flex-col">
      <div className="flex-col flex-1">
        <Link className="block" href="/units">
          Units
        </Link>
        <Link className="block" href="/ingredients">
          Ingredients
        </Link>
        <Link className="block" href="/recipes">
          Recipes
        </Link>
      </div>
      <div>
        <a href="/settings">Settings</a>
      </div>
    </nav>
  );
};

const Router = () => {
  return (
    <main className="flex-1">
      <Switch>
        <Route path="/units" component={UnitsPage} />
        <Route path="/ingredients" component={IngredientsPage} />
      </Switch>
    </main>
  );
};

const App = () => {
  return (
    <div className="flex flex-row">
      <Sidebar />
      <Router />
    </div>
  );
};

export default App;

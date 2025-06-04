import { Route, Switch } from "wouter";
import UnitsPage from "./pages/UnitsPage";
import UnitPage from "./pages/UnitPage";

const Sidebar = () => {
  return (
    <nav className="h-dvh bg-red-400 flex flex-col">
      <div className="flex-col flex-1">
        <a className="block" href="/units">
          Units
        </a>
        <a className="block" href="/ingredients">
          Ingredients
        </a>
        <a className="block" href="/recipes">
          Recipes
        </a>
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
        <Route path="/new-unit" component={UnitPage} />
        <Route path="/unit/:id" component={UnitPage} />
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

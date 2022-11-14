import { Recipe } from '../pages/api/recipes';
import PagerButton from './PagerButton';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';

function renderRecipe(recipe: Recipe) {
  return (
    <div className="p-2 border-2 border-gray-500 shadow-sm">
      <p className="text-center text-xl">{recipe.name}</p>
      <hr className="border-black mt-2 mb-4" />
    </div>
  );
}

function renderAddPlaceholderRecipe() {
  return (
    <div className="group flex flex-col justify-center items-center p-2 border-2 border-dashed border-gray-500 text-gray-500">
      <p className="add-recipe-label text-center text-4xl my-4 group-hover:text-black transition-colors">
        Add a new recipe
      </p>
      <FontAwesomeIcon
        className="group-hover:text-secondary transition-colors"
        icon={faPlusCircle}
        size="4x"
      />
    </div>
  );
}

async function getData(numberOfRecipes = 12): Promise<Recipe[]> {
  const res = await fetch(
    `http://localhost:3000/api/recipes?c=${numberOfRecipes}`
  );
  return res.json();
}

export default async function RecipeSelector() {
  const recipes = await getData();

  return (
    <div className="flex-grow flex flex-col px-6 pb-4">
      <p className="font-bold text-2xl text-center my-4">Recipes</p>
      <div className="flex-grow flex">
        {/* <PagerButton direction="LEFT" /> */}
        <div className="flex-grow grid grid-cols-4 px-6 gap-4">
          {[
            ...recipes.map((recipe) => renderRecipe(recipe)),
            renderAddPlaceholderRecipe(),
          ]}
        </div>
        {/* <PagerButton direction="RIGHT" /> */}
      </div>
    </div>
  );
}

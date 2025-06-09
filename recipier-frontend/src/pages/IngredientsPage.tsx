import api from "@/api";
import { useLocation } from "wouter";

const IngredientsPage = () => {
  const [_, setLocation] = useLocation();
  const ingredientsQuery = api.useQuery("get", "/ingredient");

  const handleIngredientClick = (ingredientId: number) => {
    setLocation(`/ingredient/${ingredientId}`);
  };

  if (ingredientsQuery.isLoading) {
    return <div className="p-4">Loading ingredients...</div>;
  }

  if (ingredientsQuery.error) {
    return (
      <div className="p-4 text-red-500">
        Error loading ingredients: {JSON.stringify(ingredientsQuery)}
      </div>
    );
  }

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Ingredients</h1>
        <a
          href="/ingredient/new"
          className="bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          New Ingredient
        </a>
      </header>

      {ingredientsQuery.data && ingredientsQuery.data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ingredientsQuery.data.map((ingredient) => (
            <div
              key={ingredient.id}
              onClick={() => handleIngredientClick(ingredient.id!)}
              className="border bg-white p-4 shadow-sm cursor-pointer hover:bg-gray-50 transition-all"
            >
              <span className="text-gray-700">
                {ingredient.name}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">
          No ingredients yet. Click <i>New Ingredient</i> to add one.
        </p>
      )}

    </div>
  );
};

export default IngredientsPage;
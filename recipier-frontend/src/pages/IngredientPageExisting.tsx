import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import api from "@/api";
import IngredientForm, {
  IngredientFormData,
} from "@/components/form/IngredientForm.tsx";
import type { components } from "@/api/schema";

type GetIngredient = components["schemas"]["GetIngredient"];

// Helper to convert API data to form data
const toIngredientFormData = (ingredient: GetIngredient): IngredientFormData => ({
  name: ingredient.name || "",
  description: ingredient.description || "",
});

const IngredientPageExisting = () => {
  const params = useParams();
  const [, setLocation] = useLocation();
  const ingredientId = parseInt(params.id!, 10);

  const ingredientQuery = api.useQuery("get", "/ingredient/{id}", {
    params: { path: { id: ingredientId } },
  });

  const updateIngredientMutation = api.useMutation("put", "/ingredient", {
    onSuccess: async () => {
      await ingredientQuery.refetch();
      setLocation("/ingredients");
    },
    onError: (error) => {
      console.error("Failed to update ingredient:", error);
      alert(`Error: ${error}`);
    },
  });

  // --- 3. Form and UI State ---
  const [formData, setFormData] = useState<IngredientFormData | null>(null);

  // Populate the form state once the initial data is loaded
  useEffect(() => {
    if (ingredientQuery.data) {
      setFormData(toIngredientFormData(ingredientQuery.data));
    }
  }, [ingredientQuery.data]);

  // --- 4. Event Handlers ---
  const handleSubmit = (ingredient: IngredientFormData) => {
    updateIngredientMutation.mutate({
      body: {
        id: ingredientId,
        name: ingredient.name,
        description: ingredient.description,
      },
    });
  };

  // --- 5. Render Logic ---
  if (ingredientQuery.isLoading) {
    return <div className="p-4">Loading ingredient...</div>;
  }

  if (ingredientQuery.error) {
    return (
      <div className="p-4 text-red-500">
        Error loading ingredient
      </div>
    );
  }

  if (!formData) {
    return <div className="p-4">Ingredient not found.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Edit Ingredient</h1>
      <IngredientForm
        initialIngredient={formData}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default IngredientPageExisting;
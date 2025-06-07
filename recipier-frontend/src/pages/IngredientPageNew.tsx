import { useLocation } from "wouter";
import api from "@/api";
import IngredientForm, {
  IngredientFormData,
} from "@/components/form/IngredientForm.tsx";

const IngredientPageNew = () => {
  const [, setLocation] = useLocation();

  const createIngredientMutation = api.useMutation("post", "/ingredient", {
    onSuccess: () => {
      setLocation("/ingredients");
    },
    onError: (error) => {
      console.error("Failed to create ingredient:", error);
      alert(`Error: ${error}`);
    },
  });

  const handleSubmit = (ingredient: IngredientFormData) => {
    createIngredientMutation.mutate({
      body: {
        name: ingredient.name,
        description: ingredient.description,
      },
    });
  };

  const initialFormData: IngredientFormData = {
    name: "",
    description: "",
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Create New Ingredient</h1>
      <IngredientForm
        initialIngredient={initialFormData}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default IngredientPageNew;
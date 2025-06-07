import { FormEvent, useState } from "react";
import TextInput from "@/components/input/TextInput.tsx";

// The form ingredient represents the intermediate state of the ingredient being edited or created
export interface IngredientFormData {
  name: string;
  description: string;
}

export interface IngredientFormProps {
  initialIngredient?: IngredientFormData;
  onSubmit: (ingredient: IngredientFormData) => void;
}

const IngredientForm = (params: IngredientFormProps) => {
  const [formData, setFormData] = useState<IngredientFormData>(params.initialIngredient || {
    name: "",
    description: ""
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    params.onSubmit(formData);
  };

  return (
    <form className="max-w-4xl mx-auto" onSubmit={handleSubmit}>
      <div className="flex flex-col space-y-4">
        <TextInput
          label="Ingredient Name"
          value={formData.name}
          onChange={(value) => setFormData({ ...formData, name: value || "" })}
          placeholder="Like Tomato, Flour, Salt"
        />
        <TextInput
          label="Description"
          value={formData.description}
          onChange={(value) => setFormData({ ...formData, description: value || "" })}
          placeholder="Description of the ingredient"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Submit
        </button>
      </div>
    </form>
  );
};

export default IngredientForm;
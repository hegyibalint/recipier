import { useLocation } from "wouter";
import api from "@/api";
import UnitForm, {
  selectOptions,
  UnitFormData,
} from "@/components/form/UnitForm.tsx";

const UnitPageNew = () => {
  const [, setLocation] = useLocation();

  const createUnitMutation = api.useMutation("post", "/unit", {
    onSuccess: () => {
      setLocation("/units");
    },
    onError: (error) => {
      console.error("Failed to create unit:", error);
      alert(`Error: ${error}`);
    },
  });

  const handleSubmit = (unit: UnitFormData) => {
    createUnitMutation.mutate({
      body: {
        name: unit.name,
        abbreviation: unit.abbreviation,
        type: selectOptions[unit.typeIndex]!.value,
        description: unit.description,
      },
    });
  };

  const initialFormData: UnitFormData = {
    name: "",
    abbreviation: "",
    typeIndex: 0,
    description: "",
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Create New Unit</h1>
      <UnitForm
        initialUnit={initialFormData}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default UnitPageNew;
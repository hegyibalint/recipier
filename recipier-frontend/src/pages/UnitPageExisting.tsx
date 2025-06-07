import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import api from "@/api";
import UnitForm, {
  selectOptions,
  UnitFormData,
} from "@/components/form/UnitForm.tsx";
import type { components } from "@/api/schema";

type GetUnit = components["schemas"]["GetUnit"];

// Helper to convert API data to form data
const toUnitFormData = (unit: GetUnit): UnitFormData => ({
  name: unit.name || "",
  abbreviation: unit.abbreviation || "",
  typeIndex: selectOptions.findIndex((opt) => opt.value === unit.type) ?? 0,
  description: unit.description || "",
});

const UnitPageExisting = () => {
  const params = useParams();
  const [, setLocation] = useLocation();
  const unitId = parseInt(params.id!, 10);

  const unitQuery = api.useQuery("get", "/unit/{id}", {
    params: { path: { id: unitId } },
  });

  const updateUnitMutation = api.useMutation("put", "/unit/{id}", {
    onSuccess: async () => {
      await unitQuery.refetch();
      setLocation("/units");
    },
    onError: (error) => {
      console.error("Failed to update unit:", error);
      alert(`Error: ${error}`);
    },
  });

  // --- 3. Form and UI State ---
  const [formData, setFormData] = useState<UnitFormData | null>(null);

  // Populate the form state once the initial data is loaded
  useEffect(() => {
    if (unitQuery.data) {
      setFormData(toUnitFormData(unitQuery.data));
    }
  }, [unitQuery.data]);

  // --- 4. Event Handlers ---
  const handleSubmit = (unit: UnitFormData) => {
    updateUnitMutation.mutate({
      params: { path: { id: unitId } },
      body: {
        name: unit.name,
        abbreviation: unit.abbreviation,
        type: selectOptions[unit.typeIndex]!.value,
        description: unit.description,
      },
    });
  };

  // --- 5. Render Logic ---
  if (unitQuery.isLoading) {
    return <div className="p-4">Loading unit...</div>;
  }

  if (unitQuery.error) {
    return (
      <div className="p-4 text-red-500">
        Error loading unit
      </div>
    );
  }

  if (!formData) {
    return <div className="p-4">Unit not found.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Edit Unit</h1>
      <UnitForm
        initialUnit={formData}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default UnitPageExisting;
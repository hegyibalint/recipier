import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import api from "@/api";
import Input from "@/components/Input";
import Select, { type SelectOption } from "@/components/Select";
import type { components } from "@/api/schema";

type PostUnit = components["schemas"]["PostUnit"];
type GetUnit = components["schemas"]["GetUnit"];

const UnitPage = () => {
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute("/unit/:id");
  const isNewUnit = location === "/new-unit";
  const unitId = params?.id ? parseInt(params.id) : null;

  const [formData, setFormData] = useState<PostUnit>({
    name: "",
    abbreviation: "",
    description: "",
    type: "QUANTITY",
  });
  const [originalData, setOriginalData] = useState<PostUnit>({
    name: "",
    abbreviation: "",
    description: "",
    type: "QUANTITY",
  });
  const [isEditing, setIsEditing] = useState(isNewUnit);
  const [errors, setErrors] = useState<Partial<PostUnit>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const unitQuery = api.useQuery("get", "/unit/{id}", {
    params: {
      path: { id: unitId! },
    },
    enabled: !isNewUnit && unitId !== null,
  });

  useEffect(() => {
    if (unitQuery.data) {
      const data = {
        name: unitQuery.data.name || "",
        abbreviation: unitQuery.data.abbrevation || "",
        description: unitQuery.data.description || "",
        type: unitQuery.data.type || "QUANTITY",
      };
      setFormData(data);
      setOriginalData(data);
    }
  }, [unitQuery.data]);

  const hasChanges = () => {
    return (
      formData.name !== originalData.name ||
      formData.abbreviation !== originalData.abbreviation ||
      formData.description !== originalData.description ||
      formData.type !== originalData.type
    );
  };

  const createUnitMutation = api.useMutation("post", "/unit", {
    onSuccess: () => {
      setLocation("/units");
    },
    onError: (error) => {
      console.error("Error creating unit:", error);
    },
  });

  const updateUnitMutation = api.useMutation("put", "/unit/{id}", {
    onSuccess: (data) => {
      setOriginalData(formData);
      setIsEditing(false);
      unitQuery.refetch();
    },
    onError: (error) => {
      console.error("Error updating unit:", error);
    },
  });

  const handleInputChange = (field: keyof PostUnit, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const unitTypeOptions: SelectOption[] = [
    { id: "QUANTITY", title: "Quantity", description: "Countable items (pieces, items, etc.)" },
    { id: "VOLUME", title: "Volume", description: "Liquid or bulk measurements (ml, l, cups, etc.)" },
    { id: "WEIGHT", title: "Weight", description: "Mass measurements (g, kg, lbs, etc.)" },
  ];

  const selectedUnitType = unitTypeOptions.find(option => option.id === formData.type) || null;

  const validateForm = (): boolean => {
    const newErrors: Partial<PostUnit> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.abbreviation.trim()) {
      newErrors.abbreviation = "Abbreviation is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (isNewUnit) {
        await createUnitMutation.mutateAsync({
          body: formData,
        });
      } else {
        await updateUnitMutation.mutateAsync({
          params: { path: { id: unitId! } },
          body: formData,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (isNewUnit) {
      setLocation("/units");
    } else {
      setFormData(originalData);
      setIsEditing(false);
      setErrors({});
    }
  };

  if (!isNewUnit && unitQuery.isLoading) {
    return <div className="p-4">Loading unit...</div>;
  }

  if (!isNewUnit && unitQuery.error) {
    return (
      <div className="p-4 text-red-500">
        Error loading unit: {unitQuery.error.message}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex-1">
          {isNewUnit ? (
            <h1 className="text-3xl font-normal text-gray-900">New Unit</h1>
          ) : (
            <input
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              readOnly={!isEditing}
              className="text-3xl font-normal text-gray-900 bg-transparent border-none outline-none read-only:cursor-default focus:bg-white focus:border focus:border-blue-500 px-2 py-1 -mx-2 -my-1"
              placeholder="Unit name"
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isNewUnit && !isEditing && (
            <button
              onClick={handleEdit}
              className="text-blue-600 hover:text-blue-700 px-3 py-1 text-sm font-medium"
            >
              Edit
            </button>
          )}
          {!isNewUnit && isEditing && (
            <>
              <button
                type="submit"
                form="unit-form"
                disabled={isSubmitting || !hasChanges()}
                className="bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="text-gray-600 hover:text-gray-700 px-3 py-1 text-sm font-medium"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <form id="unit-form" onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Abbreviation"
            value={formData.abbreviation}
            onChange={(e) => handleInputChange("abbreviation", e.target.value)}
            error={errors.abbreviation}
            placeholder="e.g., kg, ml, pcs"
            readOnly={!isEditing}
          />

          <Select
            label="Type"
            options={unitTypeOptions}
            value={selectedUnitType}
            onChange={(option) => {
              if (option) {
                handleInputChange("type", option.id as PostUnit["type"]);
              }
            }}
            placeholder="Select unit type"
            readOnly={!isEditing}
          />
        </div>

        <Input
          label="Description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          error={errors.description}
          placeholder="Describe this unit of measurement"
          readOnly={!isEditing}
        />

        {isNewUnit && (
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-6 py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Unit"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-700 px-6 py-2 font-medium"
            >
              Cancel
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default UnitPage;

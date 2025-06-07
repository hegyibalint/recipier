import { FormEvent, useState } from "react";
import TextInput from "@/components/input/TextInput.tsx";
import SelectInput, { SelectOption } from "@/components/input/SelectInput.tsx";

export interface UnitSelectOption extends SelectOption {
  value: "WEIGHT" | "VOLUME" | "QUANTITY";
}
export const selectOptions: UnitSelectOption[] = [
  { index: 1, name: "Weight", description: "Mass-based unit like kilogram, pound", value:"WEIGHT" },
  { index: 2, name: "Volume", description: "Liquid-based unit like liter, cup", value: "VOLUME" },
  { index: 3, name: "Quantity", description: "Count-based unit like piece, dozen, carton", value: "QUANTITY" }
];

// The form unit represents the intermediate state of the unit being edited or created
export interface UnitFormData {
  name: string;
  abbreviation: string;
  typeIndex: number
  description: string;
}

export interface UnitFormProps {
  initialUnit?: UnitFormData;
  onSubmit: (unit: UnitFormData) => void;
}

const UnitForm = (params: UnitFormProps) => {
  const [formData, setFormData] = useState<UnitFormData>(params.initialUnit || {
    name: "",
    abbreviation: "",
    typeIndex: 1, // Default to first option (Weight)
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
          label="Unit Name"
          value={formData.name}
          onChange={(value) => setFormData({ ...formData, name: value || "" })}
          placeholder="Like Kilogram, Cup, Piece"
        />
        <TextInput
          label="Abbreviation"
          value={formData.abbreviation}
          onChange={(value) => setFormData({ ...formData, abbreviation: value || "" })}
          placeholder="Like kg, cup, pc"
        />
        <SelectInput
          label="Unit Type"
          options={selectOptions}
          selected={formData.typeIndex}
          onChange={(index) => {
            setFormData({ ...formData, typeIndex: index });
          }}
        />
        <TextInput
          label="Description"
          value={formData.description}
          onChange={(value) => setFormData({ ...formData, description: value || "" })}
          placeholder="Description of the unit"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Submit
        </button>
      </div>
    </form>
  );
};

export default UnitForm;
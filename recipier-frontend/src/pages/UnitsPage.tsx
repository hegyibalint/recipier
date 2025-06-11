import api from "@/api";
import Dialog, { useDialog } from "@/components/common/Dialog.tsx";
import { components } from "@/api/schema.ts";
import UnitForm, { UnitFormData } from "@/components/form/UnitForm.tsx";

type GetUnit = components["schemas"]["GetUnit"]

const UnitsPage = () => {
  const existingUnitDialog = useDialog<UnitFormData>();
  const newUnitDialog = useDialog<UnitFormData>();

  const unitsQuery = api.useQuery("get", "/unit");
  const postUnit = api.useMutation("post", "/unit", {
    onSuccess: () => {
      unitsQuery.refetch();
      newUnitDialog.close();
    }
  });
  const putUnit = api.useMutation("put", "/unit/{id}", {
    onSuccess: () => {
      unitsQuery.refetch();
      existingUnitDialog.close();
    }
  });

  const onExistingUnitClick = (unit: GetUnit) => {
    const dialogData: UnitFormData = {
      id: unit.id,
      name: unit.name || "",
      abbreviation: unit.abbreviation || "",
      type: unit.type || "WEIGHT",
      description: unit.description || ""
    }
    existingUnitDialog.open(dialogData);
  }
  const onExistingUnitSubmit = (data: UnitFormData) => {
    postUnit.mutate({
      body: {
        name: data.name,
        abbreviation: data.abbreviation,
        type: data.type,
        description: data.description
      }
    });
  }

  const onNewUnitClick = () => {
    const newUnit: UnitFormData = {
      name: "",
      abbreviation: "",
      type: "WEIGHT",
      description: ""
    }
    newUnitDialog.open(newUnit);
  }
  const onNewUnitSubmit = (data: UnitFormData) => {
    postUnit.mutate({
      body: {
        name: data.name,
        abbreviation: data.abbreviation,
        type: data.type,
        description: data.description
      }
    });
  }


  return <>
    <div className="p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Units</h1>
        <a
          href="/unit/new"
          className="bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          New Unit
        </a>
      </header>

      {unitsQuery.data && unitsQuery.data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {unitsQuery.data.map((unit) => (
            <div
              key={unit.id}
              onClick={() => onExistingUnitClick(unit)}
              className="border bg-white p-4 shadow-sm cursor-pointer hover:bg-gray-50 transition-all"
            >
              <span className="text-gray-700">
                {unit.name} ({unit.abbreviation}) - {unit.type}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">
          No units yet. Click <i>New Unit</i> to add one.
        </p>
      )}

    </div>
    <Dialog title="Edit Unit" isOpen={existingUnitDialog.isOpen} onClose={existingUnitDialog.close}>
      <UnitForm
        initialUnit={existingUnitDialog.data}
        onSubmit={onExistingUnitSubmit}
      />
    </Dialog>
    <Dialog title="New Unit" isOpen={newUnitDialog.isOpen} onClose={newUnitDialog.close}>
      <UnitForm
        initialUnit={newUnitDialog.data}
        onSubmit={onNewUnitSubmit}
      />
    </Dialog>
  </>;
};

export default UnitsPage;

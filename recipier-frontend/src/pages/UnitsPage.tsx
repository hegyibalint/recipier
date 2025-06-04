import api from "@/api";
import { useLocation } from "wouter";

const UnitsPage = () => {
  const [, setLocation] = useLocation();
  const unitsQuery = api.useQuery("get", "/unit");

  const handleNewUnit = () => {
    setLocation("/new-unit");
  };

  const handleUnitClick = (unitId: number) => {
    setLocation(`/unit/${unitId}`);
  };

  if (unitsQuery.isLoading) {
    return <div className="p-4">Loading units...</div>;
  }

  if (unitsQuery.error) {
    return (
      <div className="p-4 text-red-500">
        Error loading units: {unitsQuery.error.message}
      </div>
    );
  }

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Units</h1>
        <button
          onClick={handleNewUnit}
          className="bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          New Unit
        </button>
      </header>

      {unitsQuery.data && unitsQuery.data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {unitsQuery.data.map((unit) => (
            <div
              key={unit.id}
              onClick={() => handleUnitClick(unit.id!)}
              className="border bg-white p-4 shadow-sm cursor-pointer hover:bg-gray-50 transition-all"
            >
              <span className="text-gray-700">
                {unit.name} ({unit.abbrevation}) - {unit.type}
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
  );
};

export default UnitsPage;

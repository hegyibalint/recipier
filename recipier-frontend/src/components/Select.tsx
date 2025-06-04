import { forwardRef } from "react";
import { useSelect } from "downshift";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

export interface SelectOption {
  id: string | number;
  title: string;
  description?: string;
}

interface SelectProps {
  label?: string;
  error?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: SelectOption | null;
  onChange?: (option: SelectOption | null) => void;
  className?: string;
  readOnly?: boolean;
}

const Select = forwardRef<HTMLButtonElement, SelectProps>(
  ({ label, error, placeholder = "Select an option...", options, value, onChange, className = "", readOnly = false }, ref) => {
    const {
      isOpen,
      selectedItem,
      getToggleButtonProps,
      getLabelProps,
      getMenuProps,
      highlightedIndex,
      getItemProps,
    } = useSelect({
      items: options,
      selectedItem: value || null,
      onSelectedItemChange: ({ selectedItem }) => {
        onChange?.(selectedItem || null);
      },
    });

    if (readOnly) {
      return (
        <div className="w-full">
          {label && (
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
          )}
          <div className={`w-full px-3 py-2 text-gray-900 ${className}`}>
            {selectedItem ? selectedItem.title : placeholder}
          </div>
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
      );
    }

    return (
      <div className="w-full">
        {label && (
          <label {...getLabelProps()} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <button
            type="button"
            ref={ref}
            {...getToggleButtonProps()}
            className={`w-full px-3 py-2 border border-gray-300 shadow-sm text-left focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              error ? "border-red-500" : ""
            } ${className}`}
          >
            <span className={selectedItem ? "text-gray-900" : "text-gray-400"}>
              {selectedItem ? selectedItem.title : placeholder}
            </span>
            <ChevronDownIcon
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          <ul
            {...getMenuProps()}
            className={`absolute z-10 top-full w-full bg-white border border-gray-300 shadow-sm max-h-60 overflow-auto ${
              isOpen ? "block" : "hidden"
            }`}
          >
            {isOpen &&
              options.map((option, index) => (
                <li
                  key={option.id}
                  {...getItemProps({ item: option, index })}
                  className={`px-3 py-2 cursor-pointer ${
                    highlightedIndex === index ? "bg-blue-50" : ""
                  } ${selectedItem?.id === option.id ? "bg-blue-100" : ""}`}
                >
                  <div className="font-medium text-gray-900">{option.title}</div>
                  {option.description && (
                    <div className="text-sm text-gray-500">{option.description}</div>
                  )}
                </li>
              ))}
          </ul>
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
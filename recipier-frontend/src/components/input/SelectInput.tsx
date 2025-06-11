import { useCombobox } from "downshift";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/16/solid";
import { CommonInputProps } from "@/components/input/index.ts";

export interface SelectOption<T> {
  name: string;
  description?: string;
  value: T
}

export interface SelectInputProps<T> extends CommonInputProps {
  options: SelectOption<T>[],
  selected?: SelectOption<T>,
  onChange: (newValue: T) => void;
}

const SelectInput = <T,>(props: SelectInputProps<T>) => {
  const {
    getInputProps,
    getItemProps,
    getLabelProps,
    getMenuProps,
    getToggleButtonProps,
    highlightedIndex,
    isOpen,
    selectedItem,
  } = useCombobox({
    items: props.options,
    itemToString: (item) => item?.name || "",
    selectedItem: props.selected,
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        props.onChange(selectedItem.value);
      }
    },
  });

  return (
    <div className={props.className}>
      {props.label && (
        <label {...getLabelProps()}>
          {props.label}
        </label>
      )}
      <div className="relative">
        <div>
          <input
            {...getInputProps()}
            readOnly
            placeholder="Select an option"
            value={props.selected?.name || ""}
          />
          <button
            {...getToggleButtonProps()}
            type="button"
            style={{ visibility: props.disabled ? "hidden" : "visible" }}
          >
            {isOpen ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          </button>
        </div>
        <ul {...getMenuProps()} className={`absolute ${!isOpen ? "hidden" : ""}`}>
          {isOpen && props.options.map((option, index) => {
            const itemProps = getItemProps({
              index,
              item: option,
            });
            return (
              <li
                key={option.name}
                {...itemProps}
              >
                <div>
                  <div>{option.name}</div>
                  {option.description && (
                    <div>{option.description}</div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default SelectInput;
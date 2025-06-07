import { useCombobox } from "downshift";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/16/solid";
import { CommonInputProps } from "@/components/input/index.ts";

export interface SelectOption {
  index: number;
  name: string;
  description?: string;
}

export interface SelectInputProps extends CommonInputProps {
  options: SelectOption[];
  selected: number;
  onChange: (index: number) => void;
}

const SelectInput = (props: SelectInputProps) => {
  const selectedOption = props.options.find(opt => opt.index === props.selected) || null;
  
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
    selectedItem: selectedOption,
    itemToString: (item) => (item ? item.name : ""),
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        props.onChange(selectedItem.index);
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
            value={selectedOption?.name || ""}
          />
          <button
            {...getToggleButtonProps()}
            type="button"
            style={{ visibility: props.disabled ? 'hidden' : 'visible' }}
          >
            {isOpen ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          </button>
        </div>
        <ul {...getMenuProps()} className={`absolute ${!isOpen ? 'hidden' : ''}`}>
          {isOpen && props.options.map((option, index) => {
            const itemProps = getItemProps({
              index,
              item: option,
            });
            return (
              <li
                key={option.index}
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
}

export default SelectInput;
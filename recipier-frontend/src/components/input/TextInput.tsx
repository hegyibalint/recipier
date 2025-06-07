import { CommonInputProps } from "@/components/input/index.ts";

export interface TextInputProps extends CommonInputProps {
  value?: string;
  placeholder?: string;
  onChange: (value: string | null) => void;
}

function TextInput(props: TextInputProps) {
  return (
    <label className="flex flex-col">
      {props.label && <span className="">{props.label}</span>}
      <input
        type="text"
        disabled={props.disabled}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        className={`px-3 py-2 border focus:ring-2 focus:ring-blue-500 ${props.className}`}
      />
    </label>
  );
}

export default TextInput;
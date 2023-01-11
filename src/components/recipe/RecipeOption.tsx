export interface RecipeOptionProps {
  name: string;
  type: 'ADD' | 'REMOVE';
  onClick: () => void;
}

function renderIcon() {}

export default function RecipeOption(props: RecipeOptionProps) {
  return <button>{props.name}</button>;
}

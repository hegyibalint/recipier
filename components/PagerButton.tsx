type Direction = 'LEFT' | 'RIGHT';

export interface PagerButtonProps {
  className?: string;
  direction: Direction;
  onClick?: () => void;
}

function roundClass(direction: Direction) {
  switch (direction) {
    case 'LEFT':
      return 'rounded-l-xl';
    case 'RIGHT':
      return 'rounded-r-xl';
  }
}

function directionText(direction: Direction) {
  switch (direction) {
    case 'LEFT':
      return '<';
    case 'RIGHT':
      return '>';
  }
}

export default function PagerButton(props: PagerButtonProps) {
  return (
    <button
      className={`px-2 bg-primary hover:bg-secondary transition-colors ${roundClass(
        props.direction
      )} ${props.className}`}
    >
      <span className="text-4xl text-white">
        {directionText(props.direction)}
      </span>
    </button>
  );
}

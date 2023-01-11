import { faHome } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type Direction = 'left' | 'right';

export interface PagerButtonProps {
  className?: string;
  direction: Direction;
  onClick?: () => void;
  onHomeClick?: () => void;
}

function topRoundClass(direction: Direction) {
  switch (direction) {
    case 'left':
      return 'rounded-tl-xl';
    case 'right':
      return 'rounded-tr-xl';
  }
}

function bottomRoundClass(direction: Direction) {
  switch (direction) {
    case 'left':
      return 'rounded-bl-xl';
    case 'right':
      return 'rounded-br-xl';
  }
}

function directionText(direction: Direction) {
  switch (direction) {
    case 'left':
      return '<';
    case 'right':
      return '>';
  }
}

export default function PagerButton(props: PagerButtonProps) {
  return (
    <div className={`flex flex-col gap-1 ${props.className}`}>
      <button className={`flex-grow px-2 bg-primary hover:bg-secondary transition-colors ${topRoundClass(props.direction)}`} onClick={props.onClick}>
        <span className="text-4xl text-white text">{directionText(props.direction)}</span>
      </button>
      <button className={`h-12 px-2 bg-primary hover:bg-secondary transition-colors ${bottomRoundClass(props.direction)}`} onClick={props.onHomeClick}>
        <FontAwesomeIcon className="text-white" icon={faHome} />
      </button>
    </div>
  );
}

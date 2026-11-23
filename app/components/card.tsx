import type { HTMLAttributes } from 'react';
import styles from './card.module.css';

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'article' | 'section';
  shape?: 'rounded' | 'capsule';
};

/** Shared surface only; callers own content, spacing, and interaction. */
export function Card({ as: Element = 'div', shape = 'rounded', className, ...props }: CardProps) {
  return <Element {...props} className={[styles.surface, shape === 'capsule' && styles.capsule, className].filter(Boolean).join(' ')} />;
}

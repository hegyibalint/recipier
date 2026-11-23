import type { ComponentProps } from 'react';
import styles from './button.module.css';

type ButtonProps = ComponentProps<'button'> & {
  variant?: 'primary' | 'secondary' | 'danger';
  shape?: 'rounded' | 'square';
};

/** Shared borderless actions; callers own placement and behavior. */
export function Button({ variant = 'primary', shape = 'rounded', type = 'button', className, ...props }: ButtonProps) {
  return <button {...props} type={type}
    className={[styles.button, styles[variant], shape === 'square' && styles.square, className].filter(Boolean).join(' ')} />;
}

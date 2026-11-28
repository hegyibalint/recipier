import type { ComponentProps } from 'react';
import styles from './button.module.css';

type ButtonProps = ComponentProps<'button'> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  shape?: 'rounded' | 'square' | 'icon';
};

/** Shared actions; callers own placement and behavior. */
export function Button({ variant = 'primary', shape = 'rounded', type = 'button', className, ...props }: ButtonProps) {
  return <button {...props} type={type}
    className={[styles.button, styles[variant], shape !== 'rounded' && styles[shape], className].filter(Boolean).join(' ')} />;
}

type IconButtonProps = Omit<ButtonProps, 'variant' | 'shape' | 'aria-label' | 'title' | 'type'> & { label: string };

export function IconButton({ label, ...props }: IconButtonProps) {
  return <Button {...props} variant="ghost" shape="icon" aria-label={label} title={label} />;
}

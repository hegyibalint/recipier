import type { MouseEventHandler, ReactNode } from 'react';
import { Link, type To } from 'react-router';
import styles from './stepper.module.css';

type StepperAction = {
  label: string;
  icon: ReactNode;
} & (
  | { to: To; onClick?: never; disabled?: never }
  | { to?: never; onClick?: MouseEventHandler<HTMLButtonElement>; disabled?: boolean }
);

type StepperProps = {
  label: ReactNode;
  previous: StepperAction;
  next: StepperAction;
  'aria-label': string;
  className?: string;
  title?: string;
};

/** One presentation for stepping through values; callers own navigation and state. */
export function Stepper({ label, previous, next, className, title, 'aria-label': ariaLabel }: StepperProps) {
  return (
    <div role="group" aria-label={ariaLabel} title={title}
      className={[styles.stepper, className].filter(Boolean).join(' ')}>
      <div className={styles.label} aria-live="polite">{label}</div>
      <Action action={previous} />
      <Action action={next} />
    </div>
  );
}

function Action({ action }: { action: StepperAction }) {
  const icon = <span aria-hidden="true">{action.icon}</span>;
  return action.to !== undefined ? (
    <Link className={styles.action} to={action.to} aria-label={action.label}>{icon}</Link>
  ) : (
    <button className={styles.action} type="button" onClick={action.onClick}
      disabled={action.disabled} aria-label={action.label}>{icon}</button>
  );
}

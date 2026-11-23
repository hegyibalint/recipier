import { useEffect, useState, type ReactNode } from 'react';
import { Button } from './button';
import styles from './editable.module.css';

type Props = {
  value: string;
  label: string;
  name: string;
  disabled?: boolean;
  saved?: object;
  children: ReactNode;
};

/** Place inside a form; children provide the form's save control. */
export function Editable({ value, label, name, disabled = false, saved, children }: Props) {
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (saved) setEditing(false);
  }, [saved]);

  if (!editing) return <span className={styles.display}>
    <span className={styles.value}>{value}</span>
    <button type="button" className={styles.pencil} aria-label={`Edit ${label.toLowerCase()}`}
      disabled={disabled} onClick={() => setEditing(true)}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m16 3 5 5M3 21l5-1L21 7a2.12 2.12 0 0 0-3-3L5 17l-2 4Z" />
      </svg>
    </button>
  </span>;

  return <span className={styles.editor} onKeyDown={event => {
    if (event.key === 'Escape' && !disabled) {
      event.preventDefault();
      setEditing(false);
    }
  }}>
    <input aria-label={label} name={name} defaultValue={value} required autoFocus disabled={disabled} />
    <span className={styles.actions}>
      {children}
      <Button variant="secondary" shape="square" disabled={disabled} onClick={() => setEditing(false)}>Cancel</Button>
    </span>
  </span>;
}

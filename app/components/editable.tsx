import { useEffect, useState, type ReactNode } from 'react';
import { Button, IconButton } from './button';
import { PencilIcon } from './pencil-icon';
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
    <IconButton label={`Edit ${label.toLowerCase()}`} disabled={disabled} onClick={() => setEditing(true)}>
      <PencilIcon />
    </IconButton>
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

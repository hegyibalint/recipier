import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import { Button } from './button';
import styles from './dialog.module.css';

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null>;
};

/** A full-page modal layer. The browser owns focus trapping, inertness, and Escape. */
export function Dialog({ open, onClose, title, description, children, footer, initialFocusRef }: DialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const backdropPointer = useRef(false);
  const id = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      initialFocusRef?.current?.focus({ preventScroll: true });
    } else if (!open && element.open) {
      element.close();
    }
  }, [open, initialFocusRef]);

  const close = () => dialog.current?.close();

  return <dialog ref={dialog} className={styles.dialog} aria-labelledby={`${id}-title`}
    aria-describedby={description ? `${id}-description` : undefined} onClose={onClose}
    onPointerDown={event => { backdropPointer.current = event.target === event.currentTarget; }}
    onClick={event => {
      if (backdropPointer.current && event.target === event.currentTarget) close();
    }}>
    <div className={styles.surface}>
      <div className={styles.header}>
        <h2 id={`${id}-title`}>{title}</h2>
        <Button variant="secondary" className={styles.close} aria-label="Close dialog" onClick={close}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </Button>
      </div>
      <div className={styles.body}>
        {description && <p id={`${id}-description`}>{description}</p>}
        {children}
      </div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  </dialog>;
}

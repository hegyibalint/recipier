import { useId, useRef, useState, type ReactNode } from 'react';
import { Form } from 'react-router';
import { Button } from './button';
import { Dialog } from './dialog';

type ConfirmDeleteProps = {
  itemName: string;
  children: ReactNode;
  actionLabel?: string;
  description?: string;
  details?: ReactNode;
  fields?: Record<string, string>;
  disabled?: boolean;
  preventScrollReset?: boolean;
  className?: string;
  'aria-label'?: string;
};

/** A separate POST form, so an invalid edit draft never blocks deletion. */
export function ConfirmDelete({ itemName, children, actionLabel = 'Delete',
  description = 'This will permanently delete it. This cannot be undone.', details, fields = {}, disabled,
  className, preventScrollReset, 'aria-label': ariaLabel }: ConfirmDeleteProps) {
  const [open, setOpen] = useState(false);
  const cancel = useRef<HTMLButtonElement>(null);
  const formId = `${useId()}-delete-form`;
  return <>
    <button type="button" className={className} disabled={disabled} aria-label={ariaLabel}
      aria-haspopup="dialog" onClick={() => setOpen(true)}>{children}</button>
    <Dialog open={open} onClose={() => setOpen(false)} title={`Delete “${itemName}”?`}
      description={description} initialFocusRef={cancel}
      footer={<>
        <Button ref={cancel} variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
        <Button variant="danger" type="submit" form={formId} name="intent" value="delete"
          disabled={disabled}>{actionLabel}</Button>
      </>}>
      {details}
      <Form id={formId} method="post" replace preventScrollReset={preventScrollReset} onSubmit={() => setOpen(false)}>
        {Object.entries(fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      </Form>
    </Dialog>
  </>;
}

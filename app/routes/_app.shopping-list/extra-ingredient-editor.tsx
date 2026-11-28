import { useCallback, useId, useRef, useState } from 'react';
import { Form } from 'react-router';
import { Button, IconButton } from '../../components/button';
import { Dialog } from '../../components/dialog';
import { extraIngredientLimits as limits, type ExtraIngredient } from '../../lib/planning/shopping-extras';
import { TrashIcon } from './trash-icon';
import styles from './extra-ingredient-editor.module.css';

export function ExtraIngredientEditor({ item, open, busy, error, onClose }: {
  item?: ExtraIngredient;
  open: boolean;
  busy: boolean;
  error?: string;
  onClose: () => void;
}) {
  const form = useId();
  const name = useRef<HTMLInputElement>(null);
  return (
    <Dialog open={open} onClose={onClose} title={item ? 'Edit extra ingredient' : 'Add extra ingredient'} initialFocusRef={name}
      footer={<>
        <Button variant="secondary" disabled={busy} onClick={onClose}>Cancel</Button>
        <Button type="submit" form={form} disabled={busy}>{item ? 'Save' : 'Add ingredient'}</Button>
      </>}>
      {open && <Form id={form} method="post" replace preventScrollReset className={styles.editor}>
        <input type="hidden" name="intent" value={item ? 'edit' : 'add'} />
        {item && <input type="hidden" name="id" value={item.id} />}
        <label>Name <input ref={name} name="name" required readOnly={busy} maxLength={limits.name} defaultValue={item?.name} /></label>
        <label>Original name (optional)
          <input name="original_name" maxLength={limits.name} readOnly={busy} defaultValue={item?.original_name ?? ''} />
        </label>
        <label>Description (optional)
          <textarea name="description" rows={2} maxLength={limits.description} readOnly={busy} defaultValue={item?.description ?? ''} />
        </label>
        <QuantityFields initial={item?.quantities ?? []} busy={busy} />
        {error && <p role="alert">{error}</p>}
      </Form>}
    </Dialog>
  );
}

type Quantity = ExtraIngredient['quantities'][number];
type QuantityRow = { key: number; value?: Quantity };

function QuantityFields({ initial, busy }: { initial: Quantity[]; busy: boolean }) {
  const [rows, setRows] = useState<QuantityRow[]>(() => initial.map((value, key) => ({ key, value })));
  const nextKey = useRef(initial.length);
  const focusAmount = useCallback((input: HTMLInputElement | null) => input?.focus(), []);

  function addRow() {
    const key = nextKey.current++;
    setRows(current => [...current, { key }]);
  }

  return <fieldset className={styles.quantityFields}>
    <legend>Quantities (optional)</legend>
    {rows.map(({ key, value }, index) => <div key={key} className={styles.quantityRow}>
      <label>Amount
        <input name="amount" type="number" step="any" required readOnly={busy} defaultValue={value?.amount}
          ref={!value && index === rows.length - 1 ? focusAmount : undefined} />
      </label>
      <label>Unit <input name="unit" readOnly={busy} maxLength={limits.unit} defaultValue={value?.unit ?? ''} /></label>
      <IconButton label={`Remove quantity ${index + 1}`} disabled={busy}
        onClick={() => setRows(current => current.filter(row => row.key !== key))}><TrashIcon /></IconButton>
    </div>)}
    <Button variant="outline" disabled={busy || rows.length >= limits.quantities} onClick={addRow}>
      <span aria-hidden="true">+</span> Add quantity
    </Button>
  </fieldset>;
}

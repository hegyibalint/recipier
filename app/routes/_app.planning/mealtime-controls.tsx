import { useId, useRef } from 'react';
import { Form } from 'react-router';
import { Button } from '../../components/button';
import { ConfirmDelete } from '../../components/confirm-delete';
import { Dialog } from '../../components/dialog';
import type { MealtimeWithUsage } from '../../lib/planning/mealtimes.client';
import styles from './mealtime-controls.module.css';

export function MealtimeControls({ meal, busy, first, last, onMove, onRename }: {
  meal: MealtimeWithUsage;
  busy: boolean;
  first: boolean;
  last: boolean;
  onMove: (step: -1 | 1) => void;
  onRename: () => void;
}) {
  const count = meal.planned_meals_count;
  const impact = count === 0 ? 'This meal time has no planned meals.'
    : `Deleting this meal time will also remove ${count} planned ${count === 1 ? 'meal' : 'meals'} across your plan.`;
  return (
    <div className={styles.controls} role="group" aria-label={`Manage ${meal.name}`}>
      <div className={styles.arrows}>
        <Button variant="secondary" shape="square" aria-label={`Move ${meal.name} up`} aria-disabled={busy || first}
          onClick={() => { if (!busy && !first) onMove(-1); }}>↑</Button>
        <Button variant="secondary" shape="square" aria-label={`Move ${meal.name} down`} aria-disabled={busy || last}
          onClick={() => { if (!busy && !last) onMove(1); }}>↓</Button>
      </div>
      <div className={styles.rowActions}>
        <button type="button" disabled={busy} aria-label={`Rename ${meal.name}`} aria-haspopup="dialog" onClick={onRename}>Rename</button>
        <ConfirmDelete itemName={meal.name} fields={{ id: meal.id }} actionLabel="Delete meal time"
          aria-label={`Delete ${meal.name}`} disabled={busy} description={impact} preventScrollReset
          details={<p>Your recipes will be kept. This cannot be undone.</p>}>
          Delete
        </ConfirmDelete>
      </div>
    </div>
  );
}

export function MealtimeEditor({ open, meal, busy, error, onClose }: {
  open: boolean;
  meal?: MealtimeWithUsage;
  busy: boolean;
  error?: string;
  onClose: () => void;
}) {
  const form = useId();
  const name = useRef<HTMLInputElement>(null);
  return (
    <Dialog open={open} onClose={onClose} title={meal ? `Rename ${meal.name}` : 'Add meal time'} initialFocusRef={name}
      description={meal ? 'The new name will appear in every week.' : 'This row will appear at the bottom of every week.'}
      footer={<Button type="submit" form={form} disabled={busy}>{meal ? 'Save name' : 'Add meal time'}</Button>}>
      {open && <Form id={form} method="post" replace preventScrollReset className={styles.editor}>
        <input type="hidden" name="intent" value={meal ? 'update' : 'create'} />
        {meal && <input type="hidden" name="id" value={meal.id} />}
        <label>Name <input ref={name} name="name" required defaultValue={meal?.name ?? ''} placeholder="e.g. Breakfast" /></label>
        {error && <p role="alert">{error}</p>}
      </Form>}
    </Dialog>
  );
}

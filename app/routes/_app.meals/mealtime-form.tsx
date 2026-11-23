import { useEffect, useRef } from 'react';
import { Form } from 'react-router';
import { Button } from '../../components/button';
import type { Mealtime } from '../../lib/planning/mealtimes.client';
import styles from './styles.module.css';

export function mealtimeFormId(prefix: string) {
  return `${prefix}-form`;
}

export function MealtimeForm({ meal, busy, createdId }: { meal?: Mealtime; busy: boolean; createdId?: string }) {
  const form = useRef<HTMLFormElement>(null);
  // Clear only after confirmed creation; failed submissions retain the draft.
  useEffect(() => {
    if (createdId) form.current?.reset();
  }, [createdId]);
  const prefix = meal?.id ?? 'new';
  return (
    <Form id={mealtimeFormId(prefix)} method="post" replace className={styles.form} ref={form}>
      <input type="hidden" name="intent" value={meal ? 'update' : 'create'} />
      {meal && <input type="hidden" name="id" value={meal.id} />}
      <fieldset disabled={busy}>
        <label htmlFor={`${prefix}-name`}>Name
          <input id={`${prefix}-name`} name="name" required defaultValue={meal?.name ?? ''}
            placeholder="e.g. Breakfast" />
        </label>
        <div className={styles.timeFields}>
          <label htmlFor={`${prefix}-start`}>From
            <input id={`${prefix}-start`} name="starts_at" type="text" required
              pattern="([01][0-9]|2[0-3]):[0-5][0-9]" maxLength={5} placeholder="HH:MM"
              title="Use 24-hour time, e.g. 18:30." aria-describedby={`${prefix}-time-hint`}
              defaultValue={meal?.starts_at ?? ''} />
          </label>
          <label htmlFor={`${prefix}-end`}>To
            <input id={`${prefix}-end`} name="ends_at" type="text" required
              pattern="([01][0-9]|2[0-3]):[0-5][0-9]" maxLength={5} placeholder="HH:MM"
              title="Use 24-hour time, e.g. 18:30." aria-describedby={`${prefix}-time-hint`}
              defaultValue={meal?.ends_at ?? ''} />
          </label>
        </div>
        <p className={styles.hint} id={`${prefix}-time-hint`}>24-hour local time (HH:MM), ending later the same day.</p>
        {!meal && <div className={styles.actions}>
          <Button className={styles.saveButton} type="submit">{busy ? 'Please wait…' : 'Add meal time'}</Button>
        </div>}
      </fieldset>
    </Form>
  );
}

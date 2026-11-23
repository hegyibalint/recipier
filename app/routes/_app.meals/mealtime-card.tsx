import { Button } from '../../components/button';
import { Card } from '../../components/card';
import { ConfirmDelete } from '../../components/confirm-delete';
import type { MealtimeWithUsage } from '../../lib/planning/mealtimes.client';
import { MealtimeForm, mealtimeFormId } from './mealtime-form';
import styles from './styles.module.css';

export function MealtimeCard({ meal, busy }: { meal: MealtimeWithUsage; busy: boolean }) {
  // Remount the edit form when saved values change so its defaults stay current.
  const editKey = `${meal.name}-${meal.starts_at}-${meal.ends_at}`;

  return (
    <Card as="article" className={styles.meal}>
      <header className={styles.mealHeading}>
        <h3>{meal.name}</h3>
        <p>
          <time dateTime={meal.starts_at}>{meal.starts_at}</time>
          <span aria-hidden="true"> – </span>
          <span className={styles.srOnly}> to </span>
          <time dateTime={meal.ends_at}>{meal.ends_at}</time>
        </p>
      </header>
      <details className={styles.edit}>
        <summary>Edit <span className={styles.srOnly}>{meal.name}</span></summary>
        <MealtimeForm key={editKey} meal={meal} busy={busy} />
        <footer className={styles.actions}>
          <ConfirmDelete
            itemName={meal.name}
            fields={{ id: meal.id }}
            actionLabel="Delete meal time"
            description={deletionImpact(meal.planned_meals_count)}
            details={<>
              <p>Your recipes will be kept.</p>
              <p>This cannot be undone. Are you sure you want to delete it?</p>
            </>}
            className={styles.deleteButton}
            aria-label={`Delete ${meal.name}`}
            disabled={busy}
          >
            Delete
          </ConfirmDelete>
          <Button className={styles.saveButton} type="submit" form={mealtimeFormId(meal.id)}
            aria-label={`Save ${meal.name}`} disabled={busy}>
            {busy ? 'Please wait…' : 'Save'}
          </Button>
        </footer>
      </details>
    </Card>
  );
}

function deletionImpact(count: number) {
  if (count === 0) return 'This mealtime is not used by any planned meals.';
  const single = count === 1;
  return `This mealtime is used by ${count} planned ${single ? 'meal' : 'meals'}. `
    + `Deleting it will also remove ${single ? 'that meal' : 'those meals'} from your plan.`;
}

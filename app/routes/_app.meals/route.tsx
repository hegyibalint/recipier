import { useNavigation, useRevalidator } from 'react-router';
import { deleteMealtime, loadMealtimes, saveMealtime } from '../../lib/planning/mealtimes.client';
import type { Route } from './+types/route';
import { MealtimeCard } from './mealtime-card';
import { MealtimeForm } from './mealtime-form';
import styles from './styles.module.css';

export function meta() {
  return [{ title: 'Meals · Recipier' }];
}

export function clientLoader() {
  return loadMealtimes();
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  if (request.method !== 'POST') return { error: 'Unknown action.' };
  const form = await request.formData();
  const intent = form.get('intent');
  const id = form.get('id');
  if (intent === 'delete' && typeof id === 'string') return deleteMealtime(id);
  if (intent !== 'create' && intent !== 'update') return { error: 'Unknown action.' };
  if (intent === 'update' && typeof id !== 'string') return { error: 'This meal time isn’t available.' };
  const name = form.get('name');
  return saveMealtime(intent === 'update' ? id as string : null, {
    name: typeof name === 'string' ? name.trim() : name,
    starts_at: form.get('starts_at'),
    ends_at: form.get('ends_at'),
  });
}

export function HydrateFallback() {
  return <><h1 className="page-title">Meals</h1><p role="status">Loading your meal times…</p></>;
}

export default function Meals({ loaderData, actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const busy = navigation.state !== 'idle' || revalidator.state !== 'idle';
  return (
    <>
      <header className={styles.intro}>
        <h1 className={`page-title ${styles.title}`}>Meals</h1>
        <p>Start with the rhythm of your day.</p>
        <p className="muted">Create meal times like breakfast, lunch, and dinner. These are reusable slots, not recipes or a dated plan.</p>
      </header>
      {actionData?.error && <p role="alert">{actionData.error}</p>}
      {actionData?.message && <p role="status">{actionData.message}</p>}
      {loaderData.error ? (
        <section>
          <p role="alert">{loaderData.error}</p>
          <button type="button" disabled={busy} onClick={() => revalidator.revalidate()}>
            {busy ? 'Trying again…' : 'Try again'}
          </button>
        </section>
      ) : (
        <div aria-busy={busy}>
          <section aria-labelledby="meal-times-heading">
            <h2 className={styles.sectionTitle} id="meal-times-heading">Your meal times</h2>
            {loaderData.mealtimes.length === 0 ? (
              <p className={styles.empty}>No meal times yet. Add your first one below.</p>
            ) : (
              <ul className={styles.list}>
                {loaderData.mealtimes.map(meal => (
                  <li key={meal.id}>
                    <MealtimeCard meal={meal} busy={busy} />
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className={styles.create} aria-labelledby="add-meal-heading">
            <h2 className={styles.sectionTitle} id="add-meal-heading">Add a meal time</h2>
            <MealtimeForm busy={busy} createdId={actionData?.createdId} />
          </section>
        </div>
      )}
    </>
  );
}

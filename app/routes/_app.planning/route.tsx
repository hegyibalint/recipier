import { useState } from 'react';
import { Link, useNavigation, useRevalidator, useSubmit, type ShouldRevalidateFunctionArgs } from 'react-router';
import { Button } from '../../components/button';
import { Stepper } from '../../components/stepper';
import { calendarDate, calendarWeek, localDate, shiftDate } from '../../lib/planning/calendar';
import { loadPlanning } from '../../lib/planning/overview.client';
import { deleteMealtime, reorderMealtimes, saveMealtime, type MealtimeWithUsage } from '../../lib/planning/mealtimes.client';
import { MealtimeEditor } from './mealtime-controls';
import { WeekCalendar } from './week-calendar';
import controls from './mealtime-controls.module.css';
import type { Route } from './+types/route';
import styles from './styles.module.css';

export const handle = { contentWidth: 'wide' };

export function meta() {
  return [{ title: 'Planning · Recipier' }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const today = localDate();
  const week = calendarWeek(new URL(request.url).searchParams.get('week'), today);
  const result = await loadPlanning({ from: week.start, to: shiftDate(week.start, 7) });
  if (result instanceof Response) return result;
  return { ...result, week, today };
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  if (request.method !== 'POST') return { error: 'Unknown action.' };
  const form = await request.formData();
  const intent = form.get('intent');
  const id = form.get('id');
  if (intent === 'delete' && typeof id === 'string') return deleteMealtime(id);
  if (intent === 'reorder') return reorderMealtimes(form.getAll('ids'));
  if (intent !== 'create' && intent !== 'update') return { error: 'Unknown action.' };
  if (intent === 'update' && typeof id !== 'string') return { error: 'This meal time isn’t available.' };
  return saveMealtime(intent === 'update' ? id as string : null, { name: form.get('name') });
}

// Changing the compact view's day reuses the already loaded week.
export function shouldRevalidate({ currentUrl, nextUrl, formMethod, defaultShouldRevalidate }: ShouldRevalidateFunctionArgs) {
  const current = new URL(currentUrl);
  const next = new URL(nextUrl);
  current.searchParams.delete('day');
  next.searchParams.delete('day');
  if (!formMethod && current.href === next.href && currentUrl.searchParams.get('day') !== nextUrl.searchParams.get('day')) {
    return false;
  }
  return defaultShouldRevalidate;
}

export function HydrateFallback() {
  return <><h1 className="page-title">Planning</h1><p role="status">Loading your week…</p></>;
}

const weekLabel = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' });

export default function Planning({ loaderData, actionData }: Route.ComponentProps) {
  const revalidator = useRevalidator();
  const navigation = useNavigation();
  const submit = useSubmit();
  const [editingRows, setEditingRows] = useState(false);
  const [editor, setEditor] = useState<{ meal?: MealtimeWithUsage; previousResult: typeof actionData } | null>(null);
  const busy = navigation.state !== 'idle' || revalidator.state !== 'idle';
  const { week, today, mealtimes, entries, recipes, error } = loaderData;
  const editorResult = editor && actionData !== editor.previousResult ? actionData : undefined;
  const editorOpen = editor !== null && (busy || !editorResult?.message);

  function moveRow(index: number, step: -1 | 1) {
    const ids = mealtimes.map(meal => meal.id);
    const next = index + step;
    [ids[index], ids[next]] = [ids[next], ids[index]];
    const form = new FormData();
    form.set('intent', 'reorder');
    for (const id of ids) form.append('ids', id);
    void submit(form, { method: 'post', replace: true, preventScrollReset: true });
  }

  return (
    <>
      <header className={styles.intro}>
        <h1 className={`page-title ${styles.title}`}>Planning</h1>
        <nav className={styles.actions} aria-label="Planning actions">
          {!error && mealtimes.length > 0 && <>
            <button type="button" className={controls.toggle} aria-pressed={editingRows}
              onClick={() => setEditingRows(value => !value)}>Edit rows</button>
            <span aria-hidden="true">/</span>
          </>}
          <Link to="/planning">Go to current week</Link>
        </nav>
      </header>
      <div className={styles.toolbar}>
        <Stepper aria-label="Week navigation"
          label={<h2 id="week-heading">{weekLabel.formatRange(calendarDate(week.start), calendarDate(week.days[6]))}</h2>}
          previous={{ label: 'Previous week', icon: '←', ...(week.previous ? { to: `?week=${week.previous}` } : { disabled: true }) }}
          next={{ label: 'Next week', icon: '→', ...(week.next ? { to: `?week=${week.next}` } : { disabled: true }) }} />
      </div>
      {actionData?.error && !editorOpen && <p role="alert">{actionData.error}</p>}
      {!busy && actionData?.message && <p role="status" className="muted">{actionData.message}</p>}
      <section aria-busy={busy} aria-labelledby="week-heading">
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button type="button" disabled={busy} onClick={() => revalidator.revalidate()}>
              {busy ? 'Trying again…' : 'Try again'}
            </button>
          </>
        ) : mealtimes.length === 0 ? (
          <div className={styles.empty}>
            <h3>Give your week a rhythm</h3>
            <p>Add meal times like breakfast, lunch, and dinner to see their slots here.</p>
          </div>
        ) : (
          <WeekCalendar week={week} today={today} mealtimes={mealtimes} entries={entries} recipes={recipes}
            rowEditing={editingRows ? { busy, moveRow, rename: meal => setEditor({ meal, previousResult: actionData }) } : undefined} />
        )}
        {!error && <Button variant="secondary" className={controls.add} aria-haspopup="dialog" disabled={busy}
          onClick={() => setEditor({ previousResult: actionData })}><span aria-hidden="true">+ </span>Add meal time</Button>}
      </section>
      <MealtimeEditor open={editorOpen} meal={editor?.meal} busy={busy} error={editorResult?.error} onClose={() => setEditor(null)} />
    </>
  );
}

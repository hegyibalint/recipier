import { Link, useNavigation, useRevalidator, type ShouldRevalidateFunctionArgs } from 'react-router';
import { Stepper } from '../../components/stepper';
import { calendarDate, calendarWeek, localDate, shiftDate } from '../../lib/planning/calendar';
import { loadPlanning } from '../../lib/planning/overview.client';
import { WeekCalendar } from './week-calendar';
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

export default function Planning({ loaderData }: Route.ComponentProps) {
  const revalidator = useRevalidator();
  const navigation = useNavigation();
  const busy = navigation.state !== 'idle' || revalidator.state !== 'idle';
  const { week, today, mealtimes, entries, recipes, error } = loaderData;
  return (
    <>
      <header className={styles.intro}>
        <h1 className={`page-title ${styles.title}`}>Planning</h1>
        <nav className={styles.actions} aria-label="Planning actions">
          <Link to="/meals">Edit mealtimes</Link>
          <span aria-hidden="true">/</span>
          <Link to="/planning">Go to current week</Link>
        </nav>
      </header>
      <div className={styles.toolbar}>
        <Stepper aria-label="Week navigation"
          label={<h2 id="week-heading">{weekLabel.formatRange(calendarDate(week.start), calendarDate(week.days[6]))}</h2>}
          previous={{ label: 'Previous week', icon: '←', ...(week.previous ? { to: `?week=${week.previous}` } : { disabled: true }) }}
          next={{ label: 'Next week', icon: '→', ...(week.next ? { to: `?week=${week.next}` } : { disabled: true }) }} />
      </div>
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
            <Link to="/meals">Set up meal times</Link>
          </div>
        ) : (
          <WeekCalendar week={week} today={today} mealtimes={mealtimes} entries={entries} recipes={recipes} />
        )}
      </section>
    </>
  );
}

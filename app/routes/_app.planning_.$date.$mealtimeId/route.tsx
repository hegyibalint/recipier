import { useState } from 'react';
import { Link, useNavigation, useRevalidator } from 'react-router';
import { z } from 'zod';
import { calendarDate, calendarWeek, shiftDate } from '../../lib/planning/calendar';
import { addEntry, loadEntries, removeEntry, type PlanEntry } from '../../lib/planning/entries.client';
import type { Mealtime } from '../../lib/planning/mealtimes.client';
import { loadPlanning } from '../../lib/planning/overview.client';
import { dateSchema, idSchema } from '../../lib/planning/schema';
import type { RecipeChoice } from '../../lib/recipes/choices.client';
import type { Route } from './+types/route';
import { AssignedRecipes } from './assigned-recipes';
import { RecipePicker } from './recipe-picker';
import styles from './styles.module.css';

const slotParams = z.object({ date: dateSchema, mealtimeId: idSchema });
const dateLabel = new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeZone: 'UTC' });
const weekPath = (date: string) => `/planning?week=${calendarWeek(date).start}&day=${date}`;

type SlotData = {
  date: string | null;
  meal: Mealtime | null;
  entries: PlanEntry[];
  recipes: RecipeChoice[];
  error?: string;
  notFound?: boolean;
};

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${loaderData?.meal?.name ?? 'Meal slot'} · Planning · Recipier` }];
}

export async function clientLoader({ params }: Route.ClientLoaderArgs): Promise<SlotData | Response> {
  const empty: SlotData = { date: null, meal: null, entries: [], recipes: [] };
  const parsed = slotParams.safeParse(params);
  if (!parsed.success) return { ...empty, notFound: true };
  const { date, mealtimeId } = parsed.data;
  const result = await loadPlanning({ from: date, to: shiftDate(date, 1) });
  if (result instanceof Response) return result;
  const meal = result.mealtimes.find(value => value.id === mealtimeId) ?? null;
  return {
    date, meal, recipes: result.recipes, error: result.error,
    entries: result.entries.filter(entry => entry.mealtime_id === mealtimeId),
    notFound: !result.error && !meal,
  };
}

export async function clientAction({ request, params }: Route.ClientActionArgs): Promise<{ error?: string } | Response> {
  if (request.method !== 'POST') return { error: 'Unknown action.' };
  const parsed = slotParams.safeParse(params);
  if (!parsed.success) return { error: 'This meal slot isn’t available.' };
  const { date, mealtimeId } = parsed.data;
  const form = await request.formData();
  const intent = form.get('intent');
  let result;
  if (intent === 'add') {
    // Date and mealtime always come from the page URL, not hidden form fields.
    result = await addEntry({ date, mealtime_id: mealtimeId, recipe_id: form.get('recipe_id') });
  } else if (intent === 'remove' && idSchema.safeParse(form.get('entry_id')).success) {
    const id = form.get('entry_id') as string;
    const current = await loadEntries({ from: date, to: shiftDate(date, 1) });
    if (current instanceof Response) return current;
    if (current.error) return { error: current.error };
    if (!current.entries.some(entry => entry.id === id && entry.mealtime_id === mealtimeId)) {
      return { error: 'This planned recipe isn’t in this slot. Refresh the page.' };
    }
    result = await removeEntry(id);
  } else {
    return { error: 'Unknown action.' };
  }
  if (result instanceof Response || result.error) return result;
  // Returning action data revalidates this slot without navigating away or
  // resetting the recipe search, so more recipes can be added in one visit.
  return {};
}

export function HydrateFallback() {
  return <><h1 className="page-title">Meal slot</h1><p role="status">Loading your meal slot…</p></>;
}

export default function MealSlot({ loaderData, actionData }: Route.ComponentProps) {
  // Keep the search draft on the page while a submission revalidates the slot.
  const [query, setQuery] = useState('');
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const busy = navigation.state !== 'idle' || revalidator.state !== 'idle';
  const submittedRecipe = navigation.state === 'idle' ? null : navigation.formData?.get('recipe_id');
  const { date, meal, entries, recipes, error, notFound } = loaderData;

  return (
    <div aria-busy={busy}>
      <nav className={styles.back} aria-label="Planning">
        <Link to={date ? weekPath(date) : '/planning'}>← Back to week</Link>
      </nav>
      <header className={styles.intro}>
        <h1 className={`page-title ${styles.title}`}>{meal?.name ?? 'Meal slot'}</h1>
        {date && <p><time dateTime={date}>{dateLabel.format(calendarDate(date))}</time></p>}
      </header>
      {actionData?.error && <p role="alert">{actionData.error}</p>}
      {error ? (
        <>
          <p role="alert">{error}</p>
          <button type="button" disabled={busy} onClick={() => revalidator.revalidate()}>{busy ? 'Trying again…' : 'Try again'}</button>
        </>
      ) : notFound ? (
        <p>This meal slot isn’t available. The meal time may have been removed.</p>
      ) : meal && (
        <>
          <AssignedRecipes entries={entries} recipes={recipes} busy={busy} />
          <RecipePicker
            recipes={recipes}
            mealName={meal.name}
            query={query}
            onQueryChange={setQuery}
            busy={busy}
            addingRecipeId={typeof submittedRecipe === 'string' ? submittedRecipe : undefined}
          />
        </>
      )}
    </div>
  );
}

import { Form, Link, useNavigation, useRevalidator } from 'react-router';
import { Button } from '../../components/button';
import { planningRequest } from '../../lib/planning/api.client';
import { calendarWeek, shiftDate } from '../../lib/planning/calendar';
import { dateRangeSchema, dateSchema } from '../../lib/planning/schema';
import { shoppingListSchema, shoppingListWithContributions, type ShoppingTotal } from '../../lib/planning/shopping-list';
import type { Route } from './+types/route';
import styles from './styles.module.css';

const formatAmount = new Intl.NumberFormat(undefined, { maximumSignificantDigits: 15 });

export function meta() {
  return [{ title: 'Shopping list · Recipier' }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const params = new URL(request.url).searchParams;
  const week = calendarWeek(null);
  const custom = params.has('from') || params.has('through');
  const from = custom ? params.get('from') ?? '' : week.start;
  const through = custom ? params.get('through') ?? '' : week.days[6];
  const dates = { from, through };
  const range = dateRangeSchema.safeParse({
    from, to: dateSchema.safeParse(through).success ? shiftDate(through, 1) : '',
  });
  if (!range.success) {
    return { dates, dateError: 'Choose valid dates, with the end date on or after the start date.' };
  }

  try {
    const response = await planningRequest('shopping-list', {
      method: 'POST', body: JSON.stringify(range.data),
    });
    if (response.status === 302) return response;
    if (!response.ok) throw new Error();
    const { items } = shoppingListSchema.parse(await response.json());
    const totals = shoppingListWithContributions(items).sort((a, b) =>
      a.name.localeCompare(b.name) || (a.description ?? '').localeCompare(b.description ?? ''));
    return { dates, totals };
  } catch {
    return { dates, loadError: 'Could not load your shopping list. Please try again.' };
  }
}

export function HydrateFallback() {
  return <><h1 className="page-title">Shopping list</h1><p role="status">Loading your shopping list…</p></>;
}

export default function ShoppingList({ loaderData }: Route.ComponentProps) {
  const { dates, dateError, loadError, totals } = loaderData;
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const busy = navigation.state !== 'idle' || revalidator.state !== 'idle';

  return (
    <>
      <h1 className="page-title">Shopping list</h1>
      <p>Ingredients for your meal plan, including both dates. Expand an item to see what each recipe needs.</p>
      <Form method="get" className={styles.range} key={`${dates.from}/${dates.through}`}>
        <label>From<input type="date" name="from" defaultValue={dates.from} required /></label>
        <label>Through<input type="date" name="through" defaultValue={dates.through} required /></label>
        <Button type="submit" disabled={busy}>Show list</Button>
      </Form>
      <section aria-label="Ingredients" aria-busy={busy}>
        {busy ? <p role="status">Loading your shopping list…</p> : dateError ? <p role="alert">{dateError}</p> : loadError ? (
          <>
            <p role="alert">{loadError}</p>
            <Button variant="secondary" onClick={() => revalidator.revalidate()}>Try again</Button>
          </>
        ) : totals?.length ? (
          <ul className={styles.items}>
            {totals.map(({ key, ...item }) => <IngredientRow key={key} {...item} />)}
          </ul>
        ) : (
          <p>No ingredients found for these dates. <Link to={`/planning?week=${dates.from}`}>View meal plan</Link></p>
        )}
      </section>
    </>
  );
}

type Ingredient = Omit<ReturnType<typeof shoppingListWithContributions>[number], 'key'>;

function IngredientRow({ name, description, original_names, recipes, ...total }: Ingredient) {
  return (
    <li>
      <details className={styles.ingredient}>
        <summary>
          <span className={styles.itemHeading}>
            <span>
              <strong>{name}</strong>{original_names?.length ? ` (${original_names.join(' / ')})` : ''}
              {description && <span className={styles.detail}>{description}</span>}
            </span>
            <Quantities {...total} />
          </span>
        </summary>
        <ul className={styles.contributions} aria-label="Recipe contributions">
          {recipes.map(({ id, title, ...contribution }) => (
            <li key={id}>
              <Link to={`/recipes/${id}`}>{title}</Link>
              <Quantities {...contribution} />
            </li>
          ))}
        </ul>
      </details>
    </li>
  );
}

function Quantities({ quantities, hasUnquantifiedMentions }: Pick<ShoppingTotal, 'quantities' | 'hasUnquantifiedMentions'>) {
  return (
    <span className={styles.quantities}>
      {quantities.length > 0 && <span>{quantities.map(({ amount, unit }) =>
        [formatAmount.format(amount), unit].filter(Boolean).join(' ')).join(' + ')}</span>}
      {hasUnquantifiedMentions && <span className={styles.detail}>
        {quantities.length > 0 ? 'Also mentioned without a quantity' : 'No quantity specified'}
      </span>}
    </span>
  );
}

import { Link, useNavigation, useRevalidator } from 'react-router';
import { Button } from '../../components/button';
import { Stepper } from '../../components/stepper';
import { planningRequest } from '../../lib/planning/api.client';
import { calendarDate, shiftDate } from '../../lib/planning/calendar';
import type { ShoppingRange } from '../../lib/planning/schema';
import { shoppingListSchema, shoppingListWithContributions } from '../../lib/planning/shopping-list';
import { changeExtras, loadExtras } from './extras.client';
import { ShoppingExtras } from './extras';
import { Quantities } from './quantities';
import { maxShoppingDays, shoppingSelection, type ShoppingMode } from './range';
import type { Route } from './+types/route';
import styles from './styles.module.css';

const formatDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' });

export function meta() {
  return [{ title: 'Shopping list · Recipier' }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const selected = shoppingSelection(new URL(request.url).searchParams);
  const [planned, extras] = await Promise.all([loadPlanned(selected.range), loadExtras()]);
  if (planned instanceof Response) return planned;
  if (extras instanceof Response) return extras;
  return { ...selected, ...planned, ...extras };
}

export function clientAction({ request }: Route.ClientActionArgs) {
  return changeExtras(request);
}

async function loadPlanned(range?: ShoppingRange): Promise<Response | {
  totals?: ReturnType<typeof shoppingListWithContributions>;
  loadError?: string;
}> {
  if (!range) return {};

  try {
    const response = await planningRequest('shopping-list', {
      method: 'POST', body: JSON.stringify(range),
    });
    if (response.status === 302) return response;
    if (!response.ok) throw new Error();
    const { items } = shoppingListSchema.parse(await response.json());
    const totals = shoppingListWithContributions(items).sort((a, b) =>
      a.name.localeCompare(b.name) || (a.description ?? '').localeCompare(b.description ?? ''));
    return { totals };
  } catch {
    return { loadError: 'Could not load your shopping list. Please try again.' };
  }
}

export function HydrateFallback() {
  return <><h1 className="page-title">Shopping list</h1><p role="status">Loading your shopping list…</p></>;
}

export default function ShoppingList({ loaderData, actionData }: Route.ComponentProps) {
  const { selection, range, rangeError, loadError, totals, extras, extrasError } = loaderData;
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const busy = navigation.state !== 'idle' || revalidator.state !== 'idle';

  return (
    <>
      <h1 className="page-title">Shopping list</h1>
      <ShoppingPeriods {...selection} />
      {!busy && range && <p>{rangeLabel(range)}</p>}
      <section aria-label="Ingredients" aria-busy={busy}>
        {busy ? <p role="status">Loading your shopping list…</p> : rangeError ? <p role="alert">{rangeError}</p> : loadError ? (
          <>
            <p role="alert">{loadError}</p>
            <Button variant="secondary" onClick={() => revalidator.revalidate()}>Try again</Button>
          </>
        ) : totals?.length ? (
          <ul className={styles.items}>
            {totals.map(({ key, ...item }) => <IngredientRow key={key} {...item} />)}
          </ul>
        ) : (
          <p>No ingredients found for these dates. <Link to={range ? `/planning?week=${range.from}` : '/planning'}>View meal plan</Link></p>
        )}
      </section>
      <ShoppingExtras items={extras} loadError={extrasError} result={actionData} busy={busy}
        retry={() => revalidator.revalidate()} />
    </>
  );
}

function shoppingPeriodUrl(mode: Exclude<ShoppingMode, 'linked'>, days: number) {
  return `?mode=${mode}&days=${days}`;
}

function ShoppingPeriods({ mode, days }: { mode: ShoppingMode; days: number }) {
  const periods = [
    ['days', 'Days ahead'],
    ['next-week', 'Next week'],
    ['all', 'All upcoming'],
  ] as const;
  return (
    <div className={styles.periods}>
      <nav aria-label="Shopping period" className={styles.options}>
        {periods.map(([value, label]) => (
          <Link key={value} to={shoppingPeriodUrl(value, days)} aria-current={mode === value ? 'true' : undefined}>
            {label}
          </Link>
        ))}
      </nav>
      {mode === 'days' && <Stepper aria-label="Days to shop for" className={styles.dayCount}
        label={`${days} ${days === 1 ? 'day' : 'days'}`}
        previous={{
          label: 'Shop for one fewer day', icon: '−',
          ...(days > 1 ? { to: shoppingPeriodUrl('days', days - 1) } : { disabled: true }),
        }}
        next={{
          label: 'Shop for one more day', icon: '+',
          ...(days < maxShoppingDays ? { to: shoppingPeriodUrl('days', days + 1) } : { disabled: true }),
        }}
      />}
    </div>
  );
}

function rangeLabel({ from, to }: ShoppingRange) {
  const start = calendarDate(from);
  if (!to) return `All planned recipes from ${formatDate.format(start)} onward.`;
  const last = shiftDate(to, -1);
  return `Ingredients for ${from === last ? formatDate.format(start) : formatDate.formatRange(start, calendarDate(last))}.`;
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

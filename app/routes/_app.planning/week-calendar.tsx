import { Link, useSearchParams } from 'react-router';
import type { PlanEntry } from '../../lib/planning/entries.client';
import type { RecipeChoice } from '../../lib/recipes/choices.client';
import type { MealtimeWithUsage } from '../../lib/planning/mealtimes.client';
import { calendarDate, type CalendarWeek } from '../../lib/planning/calendar';
import { MealtimeControls } from './mealtime-controls';
import { PlanSlot } from './plan-slot';
import styles from './week-calendar.module.css';

const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short', timeZone: 'UTC' });
const dayNumber = new Intl.DateTimeFormat(undefined, { day: 'numeric', timeZone: 'UTC' });
const fullDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeZone: 'UTC' });

export function WeekCalendar({ week, today, mealtimes, entries, recipes, rowEditing }: {
  week: CalendarWeek;
  today: string;
  mealtimes: MealtimeWithUsage[];
  entries: PlanEntry[];
  recipes: RecipeChoice[];
  rowEditing?: {
    busy: boolean;
    moveRow: (index: number, step: -1 | 1) => void;
    rename: (meal: MealtimeWithUsage) => void;
  };
}) {
  const [search] = useSearchParams();
  const requestedDay = search.get('day');
  const selectedDay = requestedDay && week.days.includes(requestedDay)
    ? requestedDay : week.days.includes(today) ? today : week.start;
  const recipeNames = new Map(recipes.map(recipe => [recipe.id, recipe.title]));
  const slots = new Map<string, PlanEntry[]>();
  for (const entry of entries) {
    const key = `${entry.date}/${entry.mealtime_id}`;
    const slot = slots.get(key) ?? [];
    slot.push(entry);
    slots.set(key, slot);
  }
  return (
    <>
      <nav className={styles.dayPicker} aria-label="Choose a day">
        {week.days.map(day => (
          <Link key={day} to={`?week=${week.start}&day=${day}`} preventScrollReset
            className={styles.dayChoice} aria-current={day === selectedDay ? 'page' : undefined}
            aria-label={fullDate.format(calendarDate(day))} data-today={day === today}>
            <span>{weekday.format(calendarDate(day))}</span>
            <time dateTime={day}>{dayNumber.format(calendarDate(day))}</time>
          </Link>
        ))}
      </nav>
      <div className={styles.selectedDate}>
        <h3>{fullDate.format(calendarDate(selectedDay))}</h3>
        {selectedDay === today && <span>Today</span>}
      </div>
      <div className={styles.calendar} role="table" aria-labelledby="week-heading">
        <div className={styles.dayHeaders} role="row">
          <div className={styles.corner} role="columnheader">Meal</div>
          {week.days.map(day => (
            <div key={day} className={styles.dayHeader} role="columnheader"
              data-selected={day === selectedDay} aria-current={day === today ? 'date' : undefined}>
              <span className={styles.weekday}>{weekday.format(calendarDate(day))}</span>
              <time dateTime={day}>{dayNumber.format(calendarDate(day))}</time>
            </div>
          ))}
        </div>
        {mealtimes.map((meal, index) => (
          <div key={meal.id} className={styles.mealRow} role="row">
            <div className={styles.mealLabel} role="rowheader">
              <span className={styles.mealName}>{meal.name}</span>
              {rowEditing && <MealtimeControls meal={meal} busy={rowEditing.busy} first={index === 0}
                last={index === mealtimes.length - 1} onMove={step => rowEditing.moveRow(index, step)}
                onRename={() => rowEditing.rename(meal)} />}
            </div>
            {week.days.map(day => (
              <div key={day} className={styles.dayCell} role="cell" data-selected={day === selectedDay}>
                <PlanSlot day={day} meal={meal} entries={slots.get(`${day}/${meal.id}`) ?? []} recipeNames={recipeNames} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

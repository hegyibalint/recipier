import { Link } from 'react-router';
import type { PlanEntry } from '../../lib/planning/entries.client';
import type { Mealtime } from '../../lib/planning/mealtimes.client';
import styles from './plan-slot.module.css';

export function PlanSlot({ day, meal, entries, recipeNames }: {
  day: string;
  meal: Mealtime;
  entries: PlanEntry[];
  recipeNames: Map<string, string>;
}) {
  const titles = entries.map(entry => recipeNames.get(entry.recipe_id) ?? 'Recipe unavailable');
  return (
    <Link className={styles.slot} to={`/planning/${day}/${meal.id}`}
      data-empty={entries.length === 0}
      aria-label={`${meal.name}, ${day}: ${titles.join(', ') || 'Add recipe'}`}>
      {entries.length ? (
        <ul className={styles.recipes}>
          {entries.map((entry, index) => (
            <li key={entry.id}>
              {titles[index]}{entry.multiplier !== 1 && <span> · ×{entry.multiplier}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <span className={styles.add} aria-hidden="true">
          <span className={styles.plus}>+</span>
          <span className={styles.addLabel}>+ Add recipe</span>
        </span>
      )}
    </Link>
  );
}

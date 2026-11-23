import { Form, Link } from 'react-router';
import type { PlanEntry } from '../../lib/planning/entries.client';
import type { RecipeChoice } from '../../lib/recipes/choices.client';
import styles from './styles.module.css';

type Props = {
  entries: PlanEntry[];
  recipes: RecipeChoice[];
  busy: boolean;
};

export function AssignedRecipes({ entries, recipes, busy }: Props) {
  if (entries.length === 0) return null;
  const names = new Map(recipes.map(({ id, title }) => [id, title]));

  return (
    <section className={styles.assigned} aria-labelledby="assigned-heading">
      <h2 id="assigned-heading">In this slot</h2>
      <ul className={styles.list}>
        {entries.map(entry => {
          const title = names.get(entry.recipe_id);
          return (
            <li key={entry.id} className={styles.assignedRow}>
              <div>
                <Link to={`/recipes/${entry.recipe_id}`}>{title ?? 'Recipe unavailable'}</Link>
                {entry.multiplier !== 1 && <span> · ×{entry.multiplier}</span>}
              </div>
              <Form method="post" replace preventScrollReset>
                <input type="hidden" name="entry_id" value={entry.id} />
                <button className={styles.remove} name="intent" value="remove" disabled={busy}
                  aria-label={`Remove ${title ?? 'recipe'} from this slot`}>
                  Remove
                </button>
              </Form>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

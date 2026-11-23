import { Form, Link } from 'react-router';
import { SearchIcon } from '../../components/search-icon';
import type { RecipeChoice } from '../../lib/recipes/choices.client';
import styles from './styles.module.css';

type Props = {
  recipes: RecipeChoice[];
  mealName: string;
  query: string;
  onQueryChange: (query: string) => void;
  busy: boolean;
  addingRecipeId?: string;
};

export function RecipePicker({ recipes, mealName, query, onQueryChange, busy, addingRecipeId }: Props) {
  const search = query.trim().toLocaleLowerCase();
  const choices = recipes.filter(({ title, subtitle }) =>
    [title, subtitle].some(text => text.toLocaleLowerCase().includes(search)));

  return (
    <section aria-labelledby="choose-heading">
      <h2 className={styles.sectionTitle} id="choose-heading">Add a recipe</h2>
      {recipes.length === 0 ? <p>No recipes yet. <Link to="/">Go to recipes</Link></p> : (
        <>
          <label className={styles.search}>
            <SearchIcon />
            <input type="search" aria-label="Search recipes" value={query}
              onChange={event => onQueryChange(event.target.value)} placeholder="Title or subtitle" />
          </label>
          {choices.length === 0 && <p className="muted">No matching recipes. Try another search.</p>}
          <ul className={styles.list}>
            {choices.map(recipe => (
              <li key={recipe.id}>
                <Form method="post" replace preventScrollReset className={styles.choice}>
                  <input type="hidden" name="intent" value="add" />
                  <div className={styles.recipe}>
                    <h3><Link to={`/recipes/${recipe.id}`}>{recipe.title}</Link></h3>
                    <p>{recipe.subtitle}</p>
                  </div>
                  <button name="recipe_id" value={recipe.id} disabled={busy}
                    aria-label={`Add ${recipe.title} to ${mealName}`}>
                    {addingRecipeId === recipe.id ? 'Adding…' : 'Add'}
                  </button>
                </Form>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

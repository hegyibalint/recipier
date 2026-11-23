import { Link, useSearchParams } from 'react-router';
import { Card } from '../../components/card';
import { loadRecipes, recipeLimit, type RecipeRow } from '../../lib/recipes/store.client';
import type { Route } from './+types/route';
import styles from './styles.module.css';

export const handle = { contentWidth: 'wide' };

export function meta() {
  return [{ title: 'My recipes · Recipier' }];
}

export function clientLoader() {
  return loadRecipes();
}

export function HydrateFallback() {
  return <><h1 className={`page-title ${styles.title}`}>My recipes</h1><p role="status">Loading your recipes…</p></>;
}

export default function Recipes({ loaderData }: Route.ComponentProps) {
  const [params] = useSearchParams();
  const query = (params.get('q') ?? '').trim().toLocaleLowerCase();
  const recipes = loaderData.recipes.filter(({ document }) => !query ||
    [document.title, document.subtitle, document.description].some(text => text.toLocaleLowerCase().includes(query)));
  return (
    <>
      <h1 className={`page-title ${styles.title}`}>My recipes</h1>
      {loaderData.error && <p role="alert">{loaderData.error}</p>}
      {!loaderData.error && recipes.length === 0 && (
        <section className={styles.empty}>
          <h2>{query ? 'No matching recipes' : 'No recipes yet'}</h2>
          <p>{query ? 'Try another search, or return to all recipes.' : 'Your saved recipes will appear here.'}</p>
          {query && <Link to="/">All recipes</Link>}
        </section>
      )}
      <div className={styles.list}>
        {recipes.map(row => <RecipeCard key={row.id} row={row} />)}
      </div>
      {loaderData.recipes.length === recipeLimit && <p className="muted">Showing your newest {recipeLimit} recipes.</p>}
    </>
  );
}

function RecipeCard({ row }: { row: RecipeRow }) {
  const recipe = row.document;
  return (
    <Card as="article" className={styles.card}>
      <header className={styles.cardHeading}>
        <h2><Link to={`/recipes/${row.id}`}>{recipe.title}</Link></h2>
        <p className={styles.subtitle}>{recipe.subtitle}</p>
      </header>
      <p className={`recipe-text ${styles.description}`}>{recipe.description}</p>
      <footer className={styles.metadata}>
        {recipe.yield && <p>
          {recipe.yield.unit === 'servings'
            ? `Serves ${recipe.yield.amount}`
            : `Makes ${recipe.yield.amount} ${recipe.yield.unit}`}
        </p>}
        <p className={styles.savedAt}>Saved <time dateTime={row.created_at}>
          {new Date(row.created_at).toLocaleDateString()}
        </time></p>
      </footer>
    </Card>
  );
}

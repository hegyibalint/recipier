import { Link, useNavigation, useRevalidator } from 'react-router';
import { ConfirmDelete } from '../../components/confirm-delete';
import { Stepper } from '../../components/stepper';
import { RecipeContents } from '../../components/recipe-contents';
import { EditableTitle } from './editable-title';
import { deleteRecipe, loadRecipe, renameRecipe } from '../../lib/recipes/store.client';
import type { Route } from './+types/route';
import styles from './styles.module.css';

export function meta({ loaderData }: Route.MetaArgs) {
  const title = loaderData?.recipe?.document.title ?? (loaderData?.notFound ? 'Recipe not found' : 'Recipe');
  return [{ title: `${title} · Recipier` }];
}

export function clientLoader({ params }: Route.ClientLoaderArgs) {
  return loadRecipe(params.recipeId);
}

export async function clientAction({ request, params }: Route.ClientActionArgs) {
  const form = await request.formData();
  if (request.method !== 'POST') return { error: 'Unknown action.' };
  if (form.get('intent') === 'rename') return renameRecipe(params.recipeId, form.get('title'));
  if (form.get('intent') === 'delete') return deleteRecipe(params.recipeId);
  return { error: 'Unknown action.' };
}

export function HydrateFallback() {
  return (
    <>
      <nav className={styles.navigation} aria-label="Recipes"><Link to="/">← My recipes</Link></nav>
      <h1 className={styles.title}>Recipe</h1>
      <p role="status">Loading your recipe…</p>
    </>
  );
}

export default function Recipe({ loaderData, actionData }: Route.ComponentProps) {
  const revalidator = useRevalidator();
  const navigation = useNavigation();
  const busy = navigation.state !== 'idle' || revalidator.state !== 'idle';
  const deleting = navigation.state !== 'idle' && navigation.formData?.get('intent') === 'delete';
  const row = loaderData.recipe;
  return (
    <>
      <nav className={styles.navigation} aria-label="Recipes">
        <Link to="/">← My recipes</Link>
      </nav>
      {actionData?.error && <p role="alert">{actionData.error}</p>}
      {row ? (
        <article aria-busy={busy}>
          <header className={styles.intro}>
            <div className={styles.titleRow}>
              <div className={styles.titleGroup}>
                <EditableTitle key={row.id} title={row.document.title} busy={busy}
                  saving={navigation.state !== 'idle' && navigation.formData?.get('intent') === 'rename'}
                  result={actionData} />
                <p className={styles.subtitle}>{row.document.subtitle}</p>
              </div>
              {row.document.yield && (
                <Stepper className={styles.yieldControl} aria-label="Recipe yield"
                  title="Yield adjustment is coming soon"
                  label={<>{row.document.yield.amount} {row.document.yield.unit}</>}
                  previous={{ label: 'Decrease yield', icon: '−', disabled: true }}
                  next={{ label: 'Increase yield', icon: '+', disabled: true }} />
              )}
            </div>
            <p className={`recipe-text ${styles.description}`}>{row.document.description}</p>
          </header>
          <RecipeContents recipe={row.document} className={styles.contents} />
          <footer className={styles.actions}>
            <p className={styles.savedAt}>Saved <time dateTime={row.created_at}>
              {new Date(row.created_at).toLocaleDateString()}
            </time></p>
            <ConfirmDelete key={row.id} itemName={row.document.title} actionLabel="Delete recipe"
              className={styles.deleteButton} disabled={busy}>
              {deleting ? 'Deleting…' : 'Delete recipe'}
            </ConfirmDelete>
          </footer>
        </article>
      ) : loaderData.notFound ? (
        <section>
          <h1 className={styles.title}>Recipe not found</h1>
          <p>This recipe isn’t available. It may not exist, or you may not have access to it.</p>
        </section>
      ) : (
        <section aria-busy={busy}>
          <h1 className={styles.title}>Could not load recipe</h1>
          <p role="alert">{loaderData.error}</p>
          <button type="button" onClick={() => revalidator.revalidate()} disabled={busy}>
            {busy ? 'Trying again…' : 'Try again'}
          </button>
        </section>
      )}
    </>
  );
}

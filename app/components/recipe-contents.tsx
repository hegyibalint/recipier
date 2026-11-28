import type { Recipe } from '../lib/recipes/schema';
import { ingredientQuantities, stepParts } from '../lib/recipes/display';
import styles from './recipe-contents.module.css';

type RecipeContentsProps = {
  recipe: Recipe;
  headingLevel?: 2 | 3;
  variant?: 'full' | 'preview';
  className?: string;
};

export function RecipeContents({ recipe, headingLevel = 2, variant = 'full', className }: RecipeContentsProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const headingClass = variant === 'full' ? 'section-title' : undefined;
  const quantities = ingredientQuantities(recipe);
  return (
    <div className={[styles.contents, variant === 'full' && styles.full, className].filter(Boolean).join(' ')}>
      <section>
        <Heading className={headingClass}>Ingredients</Heading>
        {recipe.ingredients.length > 0
          ? <ul>{recipe.ingredients.map(ingredient => (
            <li key={ingredient.id}>
              {ingredient.name}{ingredient.original_name && ` (${ingredient.original_name})`}
              {quantities.has(ingredient.id) ? `: ${quantities.get(ingredient.id)}` : ''}
            </li>
          ))}</ul>
          : <p>No ingredients listed.</p>}
      </section>
      {recipe.components.map(component => (
        <section key={component.id}>
          <Heading className={headingClass}>{component.title ?? component.id}</Heading>
          {component.yield && <p>Makes {component.yield.amount} {component.yield.unit}</p>}
          {!!component.depends_on?.length && <p className={styles.dependency}>Prepare first: {component.depends_on.map(id =>
            recipe.components.find(item => item.id === id)?.title ?? id).join(', ')}</p>}
          <ol>{component.steps.map((step, index) => (
            <li className="recipe-text" key={index}>
              {stepParts(step.text, recipe).map((part, partIndex) => part.kind === 'i'
                ? <span className={styles.ingredientReference} key={partIndex}>{part.text}</span>
                : part.text)}
            </li>
          ))}</ol>
        </section>
      ))}
    </div>
  );
}

import type { Recipe } from '../recipes/schema.ts';
import { parseTemplate } from '../recipes/template.ts';

export type ShoppingItem = { name: string; amount: number | null; unit: string | null };

// A flat list of usages, not an ingredient identity/reconciliation system.
// Bare mentions remain unquantified; even repeated references are preserved.
export function ingredientsForRecipe(recipe: Recipe, multiplier: number): ShoppingItem[] {
  if (!Number.isFinite(multiplier) || multiplier <= 0) throw new Error('Invalid recipe multiplier.');
  const names = new Map(recipe.ingredients.map(ingredient => [ingredient.id, ingredient.name]));
  const items: ShoppingItem[] = [];
  for (const component of recipe.components) {
    for (const step of component.steps) {
      for (const reference of parseTemplate(step.text)) {
        // Each component's own steps are visited once; never traverse a component
        // reference or apply its amount as another scaling factor.
        if (reference.kind !== 'i') continue;
        const name = names.get(reference.id);
        if (name === undefined) throw new Error('Unknown ingredient reference.');
        const amount = reference.amount === undefined ? null : reference.amount * multiplier;
        if (amount !== null && (!Number.isFinite(amount) || amount <= 0)) {
          throw new Error('Scaled ingredient amount is outside the supported numeric range.');
        }
        items.push({ name, amount, unit: reference.unit ?? null });
      }
    }
  }
  return items;
}

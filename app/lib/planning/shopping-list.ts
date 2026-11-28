import { z } from 'zod';
import type { Recipe } from '../recipes/schema.ts';
import { parseTemplate } from '../recipes/template.ts';
import { idSchema } from './schema.ts';

const quantitySchema = z.object({ amount: z.number().positive(), unit: z.string().nullable() });
const labelSchema = z.object({ name: z.string(), description: z.string().optional() });
const shoppingItemSchema = labelSchema.extend({
  id: z.string(), original_name: z.string().optional(),
  amount: quantitySchema.shape.amount.nullable(), unit: quantitySchema.shape.unit,
});
const sourcedItemSchema = shoppingItemSchema.extend({
  source: z.object({ id: idSchema, title: z.string() }),
});
export const shoppingListSchema = z.object({ items: z.array(sourcedItemSchema) });

export const shoppingTotalSchema = labelSchema.extend({
  id: z.string(),
  original_names: z.array(z.string()).optional(),
  quantities: z.array(quantitySchema),
  hasUnquantifiedMentions: z.boolean(),
});

type ShoppingItem = z.infer<typeof shoppingItemSchema>;
export type ShoppingTotal = z.infer<typeof shoppingTotalSchema>;
type Tally = { amounts: Map<string | null, number>; hasUnquantifiedMentions: boolean };

export function summarizeShoppingList(items: ShoppingItem[]): ShoppingTotal[] {
  return Array.from(groupIngredients(items).values(), summarizeIngredient);
}

export function shoppingListWithContributions(items: z.infer<typeof sourcedItemSchema>[]) {
  return Array.from(groupIngredients(items), ([key, usages]) => {
    const byRecipe = groupBy(usages, item => item.source.id);
    const recipes = Array.from(byRecipe.values(), recipeUsages => ({
      ...recipeUsages[0].source,
      ...sumUsages(recipeUsages),
    }));
    return { key, ...summarizeIngredient(usages), recipes };
  });
}

// An ID alone doesn't make two ingredients interchangeable. A description that
// is missing or different stays separate from a specified description.
function groupIngredients<T extends ShoppingItem>(items: T[]) {
  return groupBy(items, ({ id, name, description }) => JSON.stringify([
    id, name.trim().toLowerCase(), description?.trim().toLowerCase() || null,
  ]));
}

function groupBy<T>(items: T[], keyOf: (item: T) => string) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  return groups;
}

function summarizeIngredient(items: ShoppingItem[]): ShoppingTotal {
  const { id, name, description } = items[0];
  const detail = description?.trim();
  const nameKey = name.trim().toLowerCase();
  const originalNames = new Set<string>();
  for (const item of items) {
    const original = item.original_name?.trim();
    if (original && original.toLowerCase() !== nameKey) originalNames.add(original);
  }
  return {
    id, name: capitalize(name.trim()), ...(detail && { description: capitalize(detail) }),
    ...(originalNames.size > 0 && { original_names: [...originalNames] }),
    ...sumUsages(items),
  };
}

function sumUsages(items: ShoppingItem[]) {
  const tally: Tally = { amounts: new Map(), hasUnquantifiedMentions: false };
  for (const item of items) addUsage(tally, item);
  return toTotals(tally);
}

function capitalize(label: string) {
  return label.replace(/^./u, first => first.toUpperCase());
}

function addUsage(tally: Tally, { amount, unit }: ShoppingItem) {
  if (amount === null) {
    tally.hasUnquantifiedMentions = true;
    return;
  }
  const key = unit?.trim() ?? null;
  const total = (tally.amounts.get(key) ?? 0) + amount;
  if (!Number.isFinite(total)) throw new Error('Shopping total is outside the supported numeric range.');
  tally.amounts.set(key, total);
}

function toTotals({ amounts, hasUnquantifiedMentions }: Tally) {
  return { quantities: Array.from(amounts, ([unit, amount]) => ({ amount, unit })), hasUnquantifiedMentions };
}

// A flat list of usages, not an ingredient identity/reconciliation system.
// Bare mentions remain unquantified; even repeated references are preserved.
export function ingredientsForRecipe(recipe: Recipe, multiplier: number): ShoppingItem[] {
  if (!Number.isFinite(multiplier) || multiplier <= 0) throw new Error('Invalid recipe multiplier.');
  const ingredients = new Map(recipe.ingredients.map(ingredient => [ingredient.id, ingredient]));
  const items: ShoppingItem[] = [];
  for (const component of recipe.components) {
    for (const step of component.steps) {
      for (const reference of parseTemplate(step.text)) {
        // Each component's own steps are visited once; never traverse a component
        // reference or apply its amount as another scaling factor.
        if (reference.kind !== 'i') continue;
        const ingredient = ingredients.get(reference.id);
        if (!ingredient) throw new Error('Unknown ingredient reference.');
        const amount = reference.amount === undefined ? null : reference.amount * multiplier;
        if (amount !== null && (!Number.isFinite(amount) || amount <= 0)) {
          throw new Error('Scaled ingredient amount is outside the supported numeric range.');
        }
        items.push({ ...ingredient, amount, unit: reference.unit ?? null });
      }
    }
  }
  return items;
}

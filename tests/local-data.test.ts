import { describe, expect, it } from 'vitest';
import { ingredientsForRecipe, shoppingListWithContributions, summarizeShoppingList } from '../app/lib/planning/shopping-list.ts';
import { parseRecipe } from '../app/lib/recipes/validate.ts';
import { createEntrySchema, createMealtimeSchema, idSchema } from '../app/lib/planning/schema.ts';
import { localUser, localRecipes, localRecipeId, localMealtimes, localPlan } from '../scripts/local-data.ts';

describe('local development fixtures', () => {
  it('uses valid, unique IDs for the local user, recipes, and mealtimes', () => {
    const ids = [localUser.id, ...localRecipes.map((_, index) => localRecipeId(index)), ...localMealtimes.map(mealtime => mealtime.id)];
    for (const id of ids) expect(idSchema.parse(id)).toBe(id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('contains valid recipe documents, including reference/dependency semantics', () => {
    expect(localRecipes.length).toBeGreaterThan(0);
    for (const document of localRecipes) expect(parseRecipe(document)).toEqual(document);
    expect(localRecipes.some(recipe => recipe.components.length > 1)).toBe(true);
  });

  it('keeps tofu quantities separate by description', () => {
    const recipes = localRecipes.filter(recipe => ['Chilled tofu', 'Crispy tofu'].includes(recipe.title));
    expect(recipes).toHaveLength(2);
    const totals = summarizeShoppingList(recipes.flatMap(recipe => ingredientsForRecipe(recipe, 1)));
    expect(totals.filter(item => item.id === 'tofu')).toMatchObject([
      { name: 'Tofu', description: 'Soft tofu', quantities: [{ amount: 300, unit: 'g' }] },
      { name: 'Tofu', description: 'Hard tofu', quantities: [{ amount: 400, unit: 'g' }] },
    ]);
    expect(totals.find(item => item.id === 'soy-sauce')?.quantities).toEqual([{ amount: 3, unit: 'tbsp' }]);
  });

  it('seeds a repeatable weekend plan with butter in two units', () => {
    const plan = localPlan(new Date(2026, 10, 25, 12));
    const next = localPlan(new Date(2026, 11, 2, 12));
    expect([plan.from, plan.through]).toEqual(['2026-11-28', '2026-11-29']);
    expect(plan.entries.map(entry => entry.id)).toEqual(next.entries.map(entry => entry.id));
    expect(new Set(plan.entries.map(entry => entry.id)).size).toBe(plan.entries.length);
    const recipes = new Map(localRecipes.map((recipe, index) => [localRecipeId(index), recipe]));
    const totals = shoppingListWithContributions(plan.entries.flatMap(({ id, ...entry }) => {
      expect(idSchema.parse(id)).toBe(id);
      expect(createEntrySchema.parse(entry)).toEqual(entry);
      expect(localMealtimes.some(mealtime => mealtime.id === entry.mealtime_id)).toBe(true);
      const recipe = recipes.get(entry.recipe_id)!;
      const source = { id: entry.recipe_id, title: recipe.title };
      return ingredientsForRecipe(recipe, entry.multiplier).map(item => ({ ...item, source }));
    }));
    expect(totals.find(item => item.id === 'butter')?.quantities)
      .toEqual([{ amount: 3, unit: 'tbsp' }, { amount: 50, unit: 'g' }]);
    expect(totals.filter(item => item.id === 'tofu')).toMatchObject([
      { description: 'Soft tofu', quantities: [{ amount: 650, unit: 'g' }], recipes: [
        { title: 'Chilled tofu', quantities: [{ amount: 300, unit: 'g' }] },
        { title: 'Mapo tofu', quantities: [{ amount: 350, unit: 'g' }] },
      ] },
      { description: 'Hard tofu', quantities: [{ amount: 400, unit: 'g' }] },
      { description: 'Firm tofu', quantities: [{ amount: 400, unit: 'g' }] },
    ]);
    expect(totals.find(item => item.id === 'doubanjiang')).toMatchObject({
      name: 'Fermented chili bean paste',
      original_names: ['豆瓣酱'],
      quantities: [{ amount: 1, unit: 'tbsp' }, { amount: 2, unit: 'tsp' }],
    });
    expect(totals.filter(item => item.id === 'soy-sauce')).toMatchObject([
      { quantities: [{ amount: 3, unit: 'tbsp' }] },
      { description: 'Chinese light soy sauce', quantities: [{ amount: 1, unit: 'tbsp' }] },
    ]);
  });

  it('contains valid mealtime windows', () => {
    for (const { id: _, ...mealtime } of localMealtimes) {
      expect(createMealtimeSchema.parse(mealtime)).toEqual(mealtime);
    }
  });
});

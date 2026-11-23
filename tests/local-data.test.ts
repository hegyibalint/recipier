import { describe, expect, it } from 'vitest';
import { parseRecipe } from '../app/lib/recipes/validate.ts';
import { createMealtimeSchema, idSchema } from '../app/lib/planning/schema.ts';
import { localUser, localRecipes, localRecipeId, localMealtimes } from '../scripts/local-data.ts';

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

  it('contains valid mealtime windows', () => {
    for (const { id: _, ...mealtime } of localMealtimes) {
      expect(createMealtimeSchema.parse(mealtime)).toEqual(mealtime);
    }
  });
});

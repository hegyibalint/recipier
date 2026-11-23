import { loadRecipeChoices } from '../recipes/choices.client';
import { loadEntries } from './entries.client';
import { loadMealtimes } from './mealtimes.client';
import type { DateRange } from './schema';

export async function loadPlanning(range: DateRange) {
  const [mealtimes, entries, recipes] = await Promise.all([
    loadMealtimes(),
    loadEntries(range),
    loadRecipeChoices(),
  ]);

  if (mealtimes instanceof Response) return mealtimes;
  if (entries instanceof Response) return entries;
  if (recipes instanceof Response) return recipes;

  // Do not show a failed entry query as an empty slot or a partial catalogue.
  return {
    mealtimes: mealtimes.mealtimes,
    entries: entries.entries,
    recipes: recipes.recipes,
    error: mealtimes.error ?? entries.error ?? recipes.error,
  };
}

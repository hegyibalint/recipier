import type { RecipeRow } from '../../app/lib/recipes/store.client.ts';
import type { Recipe } from '../../app/lib/recipes/schema.ts';

export const id = '12345678-1234-4234-8234-123456789abc';
export const document: Recipe = {
  title: 'Garlic butter',
  subtitle: 'A rich, savory finishing butter',
  description: 'A simple spread.\nKeep chilled.',
  yield: { amount: 100, unit: 'g' },
  ingredients: [{ id: 'butter', name: 'butter' }],
  components: [
    { id: 'base', title: 'Butter base', yield: { amount: 100, unit: 'g' }, steps: [{ text: 'Soften ${i:butter:100:g}.' }] },
    { id: 'serve', title: 'Serve', depends_on: ['base'], steps: [{ text: 'Serve ${c:base}.' }] },
  ],
};
export const row: RecipeRow = { id, created_at: '2026-11-01T12:00:00Z', document };

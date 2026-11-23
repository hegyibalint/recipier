import assert from 'node:assert/strict';
import { test } from 'vitest';
import type { Recipe } from '../recipes/schema.ts';
import { example } from '../../../tests/support/recipe-example.ts';
import { ingredientsForRecipe } from './shopping-list.ts';

const recipe: Recipe = {
  title: 'Garlic soup', subtitle: 'Garlic three ways', description: 'A garlicky soup.',
  ingredients: [
    { id: 'garlic', name: 'fresh Garlic' },
    { id: 'salt', name: 'salt to taste' },
    { id: 'unused', name: 'An unused ingredient' },
  ],
  components: [
    { id: 'base', steps: [
      { text: 'Add ${i:garlic:6:cloves}, then ${i:garlic:20:g} and ${i:salt}.' },
      { text: 'Stir ${i:garlic}, then add ${i:garlic:2:cloves}.' },
      { text: 'Show \\${i:unused:100:g} literally.' },
    ] },
    { id: 'finish', depends_on: ['base'], steps: [
      { text: 'Serve ${c:base:2} with ${i:salt} and ${i:garlic:1}.' },
    ] },
  ],
};

test('extraction flattens usages, preserves duplicates and names, and scales only explicit amounts', () => {
  assert.deepEqual(ingredientsForRecipe(recipe, 0.5), [
    { name: 'fresh Garlic', amount: 3, unit: 'cloves' },
    { name: 'fresh Garlic', amount: 10, unit: 'g' },
    { name: 'salt to taste', amount: null, unit: null },
    { name: 'fresh Garlic', amount: null, unit: null },
    { name: 'fresh Garlic', amount: 1, unit: 'cloves' },
    { name: 'salt to taste', amount: null, unit: null },
    { name: 'fresh Garlic', amount: 0.5, unit: null },
  ]);
});

test('complete multi-component example is visited once without traversing component references', () => {
  assert.deepEqual(ingredientsForRecipe(example, 2), [
    { name: 'all-purpose flour', amount: 500, unit: 'g' },
    { name: 'sugar', amount: 400, unit: 'g' },
    { name: 'butter', amount: 500, unit: 'g' },
    { name: 'powdered sugar', amount: 600, unit: 'g' },
  ]);
  assert.deepEqual(ingredientsForRecipe({ ...recipe, ingredients: [], components: [] }, 1), []);
});

test('extraction preserves unusual labels and units without normalization', () => {
  const unusual: Recipe = {
    ...recipe, ingredients: [{ id: 'salt', name: '  Weird SALT / substitute?  ' }],
    components: [{ id: 'main', steps: [{ text: '${i:salt:1e2:cuillère à soupe} ${i:salt:2: G }' }] }],
  };
  assert.deepEqual(ingredientsForRecipe(unusual, 2), [
    { name: '  Weird SALT / substitute?  ', amount: 200, unit: 'cuillère à soupe' },
    { name: '  Weird SALT / substitute?  ', amount: 4, unit: ' G ' },
  ]);
});

test('invalid multipliers, missing references and numeric overflow never produce misleading quantities', () => {
  for (const multiplier of [0, -1, NaN, Infinity, -Infinity]) {
    assert.throws(() => ingredientsForRecipe(recipe, multiplier));
  }
  assert.throws(() => ingredientsForRecipe({ ...recipe, ingredients: [] }, 1));
  assert.throws(() => ingredientsForRecipe(recipe, Number.MAX_VALUE));
  const tiny = { ...recipe, components: [{ id: 'main', steps: [{ text: '${i:garlic:5e-324:g}' }] }] };
  assert.throws(() => ingredientsForRecipe(tiny, 0.5));
});

import assert from 'node:assert/strict';
import { test } from 'vitest';
import { example } from '../../../tests/support/recipe-example.ts';
import { parseTemplate } from './template.ts';
import { recipeSchema } from './schema.ts';
import { parseRecipe, RecipeValidationError } from './validate.ts';

const minimalRecipe = {
  title: 'Water', subtitle: 'A simple boiled preparation', description: 'Water brought to a boil.',
  ingredients: [], components: [{ id: 'main', steps: [{ text: 'Boil water.' }] }],
};

test('complete recipe example from the Markdown spec passes schema and semantic validation', () => {
  assert.deepEqual(parseRecipe(example), example);
  assert.deepEqual(parseRecipe(minimalRecipe), minimalRecipe);
});

test('title, subtitle, and description must be present and nonblank', () => {
  for (const field of ['title', 'subtitle', 'description'] as const) {
    for (const value of [undefined, '', '   ', '\n\t', 42, null]) {
      assert.throws(() => parseRecipe({ ...minimalRecipe, [field]: value }), (error: unknown) =>
        error instanceof RecipeValidationError && error.issues.some(issue => issue.path === '/' + field));
    }
    const { [field]: _omitted, ...missing } = minimalRecipe;
    assert.equal(recipeSchema.safeParse(missing).success, false);
  }
});

test('one ingredient can be used in different preparation states through ordinary step text', () => {
  const recipe = {
    ...minimalRecipe,
    title: 'Garlic two ways',
    ingredients: [{ id: 'garlic', name: 'garlic' }],
    components: [{
      id: 'main',
      steps: [
        { text: 'Add ${i:garlic:10:g}, minced.' },
        { text: 'Add ${i:garlic:2:cloves} whole.' },
      ],
    }],
  };
  assert.deepEqual(parseRecipe(recipe), recipe);
  assert.deepEqual(recipe.components[0].steps.flatMap(step => parseTemplate(step.text)), [
    { kind: 'i', id: 'garlic', amount: 10, amountText: '10', unit: 'g' },
    { kind: 'i', id: 'garlic', amount: 2, amountText: '2', unit: 'cloves' },
  ]);
});

test('Zod structural validation rejects unknown nested fields without coercion', () => {
  const valid = minimalRecipe;
  const invalid = [
    { ...valid, yield: { amount: '1', unit: 'cup' } },
    { ...valid, yield: { amount: Infinity, unit: 'cup' } },
    { ...valid, yield: { amount: NaN, unit: 'cup' } },
    { ...valid, yield: { amount: -1, unit: 'cup' } },
    { ...valid, yield: { amount: 1, unit: '' } },
    { ...valid, yield: null },
    { ...valid, yield: { amount: 1, unit: 'cup', extra: true } },
    { ...valid, ingredients: [{ id: 'water', name: 'Water', amount: 1 }] },
    { ...valid, components: [{ ...valid.components[0], extra: true }] },
    { ...valid, components: [{ ...valid.components[0], yield: { amount: 1, unit: 'cup', extra: true } }] },
    { ...valid, components: [{ id: 'main', steps: [{ text: 'Boil water.', extra: true }] }] },
  ];
  for (const input of invalid) {
    assert.equal(recipeSchema.safeParse(input).success, false);
    assert.throws(() => parseRecipe(input), RecipeValidationError);
  }
  assert.deepEqual(parseRecipe(valid), valid);
});

test('structural validation reports nested JSON Pointer paths', () => {
  assert.throws(() => parseRecipe({
    ...minimalRecipe, components: [{ id: 'main', steps: [{ text: 123 }] }],
  }), (error: unknown) => error instanceof RecipeValidationError && error.issues.some(issue =>
    issue.code === 'invalid_type' && issue.path === '/components/0/steps/0/text'));
});

test('escaped references survive JSON transport without requiring ingredient or component definitions', () => {
  const recipe = {
    ...minimalRecipe, title: 'Literal references', ingredients: [],
    components: [{ id: 'main', steps: [{ text: 'Show \\${i:missing} and \\${c:missing} literally.' }] }],
  };
  const json = JSON.stringify(recipe);
  assert.ok(json.includes('\\\\${i:missing}'));
  assert.deepEqual(parseRecipe(JSON.parse(json)), recipe);
});

test('recipe validation rejects structural, identity, reference and dependency errors', () => {
  const valid = { ...minimalRecipe, title: 'Tea', ingredients: [{ id: 'tea', name: 'Tea' }], components: [{ id: 'main', steps: [{ text: 'Add ${i:tea}.' }] }] };
  const cases: [string, object][] = [
    ['unrecognized_keys', { ...valid, user_id: 'someone-else' }],
    ['invalid_type', { ingredients: [], components: valid.components }],
    ['invalid_format', { ...valid, title: '  ' }],
    ['too_small', { ...valid, components: [] }],
    ['too_small', { ...valid, components: [{ id: 'main', steps: [] }] }],
    ['required', { ...valid, ingredients: [{ id: 'tea', name: ' ' }] }],
    ['invalid_format', { ...valid, ingredients: [{ id: 'tea\n', name: 'Tea' }] }],
    ['duplicate_ingredient_id', { ...valid, ingredients: [...valid.ingredients, { id: 'tea', name: 'Other' }] }],
    ['duplicate_ingredient_name', { ...valid, ingredients: [...valid.ingredients, { id: 'other', name: ' tea ' }] }],
    ['duplicate_component_id', { ...valid, components: [...valid.components, { id: 'main', steps: [{ text: 'Other.' }] }] }],
    ['unknown_ingredient', { ...valid, ingredients: [] }],
    ['unknown_component', { ...valid, components: [{ id: 'main', depends_on: ['missing'], steps: [{ text: 'Steep.' }] }] }],
    ['self_dependency', { ...valid, components: [{ id: 'main', depends_on: ['main'], steps: [{ text: 'Steep.' }] }] }],
    ['self_component_reference', { ...valid, components: [{ id: 'main', steps: [{ text: 'Use ${c:main}.' }] }] }],
    ['undeclared_dependency', { ...valid, components: [...valid.components, { id: 'serve', steps: [{ text: 'Serve ${c:main}.' }] }] }],
    ['dependency_cycle', { ...valid, components: [{ id: 'a', depends_on: ['b'], steps: [{ text: 'A.' }] }, { id: 'b', depends_on: ['a'], steps: [{ text: 'B.' }] }] }],
    ['invalid_template', { ...valid, components: [{ id: 'main', steps: [{ text: '${i:tea' }] }] }],
    ['required', { ...valid, yield: { amount: 1, unit: ' ' } }],
    ['too_small', { ...valid, yield: { amount: 0, unit: 'cup' } }],
    ['uniqueItems', { ...valid, components: [{ id: 'main', depends_on: ['missing', 'missing'], steps: [{ text: 'Steep.' }] }] }],
  ];
  for (const [code, input] of cases) {
    assert.throws(() => parseRecipe(input), (error: unknown) =>
      error instanceof RecipeValidationError && error.issues.some(issue => issue.code === code), code);
  }
});

test('semantic issues keep their paths and order across validation passes', () => {
  const recipe = {
    ...minimalRecipe,
    yield: { amount: 1, unit: ' ' },
    ingredients: [{ id: 'water', name: 'Water' }, { id: 'water', name: ' water ' }],
    components: [
      { id: 'a', title: ' ', depends_on: ['b', 'missing'], steps: [{ text: 'Use ${c:b} and ${i:tea}.' }] },
      { id: 'b', depends_on: ['a'], steps: [{ text: 'Use ${c:a}.' }] },
    ],
  };

  assert.throws(() => parseRecipe(recipe), (error: unknown) => {
    assert.ok(error instanceof RecipeValidationError);
    assert.deepEqual(error.issues.map(({ code, path }) => [code, path]), [
      ['required', '/yield/unit'],
      ['duplicate_ingredient_id', '/ingredients/1/id'],
      ['duplicate_ingredient_name', '/ingredients/1/name'],
      ['empty', '/components/0/title'],
      ['unknown_component', '/components/0/depends_on/1'],
      ['unknown_ingredient', '/components/0/steps/0/text'],
      ['dependency_cycle', '/components'],
    ]);
    return true;
  });
});

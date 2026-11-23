import assert from 'node:assert/strict';
import { test } from 'vitest';
import { recipeJsonSchema } from './schema.ts';

function schemaObject(value: typeof recipeJsonSchema | boolean | (typeof recipeJsonSchema | boolean)[] | undefined) {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value));
  return value;
}

test('presentation guidance separates a simple dish name from variant details and context', () => {
  const properties = recipeJsonSchema.properties!;
  const title = schemaObject(properties.title).description!;
  assert.ok(title.includes('The name of the dish only'));
  assert.ok(title.includes('move flavor, equipment, method, and other variant details to the subtitle'));
  assert.ok(title.includes('Do not stack modifiers or add promotional labels'));
  assert.ok(title.includes('Use "Pulled Pork", not "Vinegar-Forward Precision Slow-Cooker Pulled Pork"'));

  const subtitle = schemaObject(properties.subtitle).description!;
  assert.ok(subtitle.includes('It may repeat the dish name when that reads naturally'));
  assert.ok(subtitle.includes('must add useful context'));
  assert.ok(subtitle.includes('For title "Pulled Pork", use "Vinegar-forward slow-cooker pulled pork"'));
  const description = schemaObject(properties.description).description!;
  assert.ok(description.includes('1–3 sentences'));
  assert.ok(description.includes('flavor, texture, and useful context'));
});

test('generated JSON Schema preserves v1 constraints and publishes step-reference guidance', () => {
  assert.equal(recipeJsonSchema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.equal(recipeJsonSchema.$id, 'urn:recipier:schema:recipe:1');
  assert.equal('~standard' in recipeJsonSchema, false, 'MCP must receive plain JSON Schema.');
  assert.deepEqual(recipeJsonSchema.required, ['title', 'subtitle', 'description', 'ingredients', 'components']);
  assert.equal(recipeJsonSchema.additionalProperties, false);

  const properties = recipeJsonSchema.properties!;
  for (const field of ['title', 'subtitle', 'description']) {
    assert.equal(schemaObject(properties[field]).minLength, 1);
    assert.equal(schemaObject(properties[field]).pattern, '\\S');
  }
  const ingredients = schemaObject(properties.ingredients);
  const components = schemaObject(properties.components);
  assert.equal(ingredients.uniqueItems, true);
  assert.equal(components.minItems, 1);
  const ingredient = schemaObject(ingredients.items);
  const component = schemaObject(components.items);
  assert.equal(ingredient.additionalProperties, false);
  assert.ok(schemaObject(ingredient.properties!.name).description!.includes('Do not include preparation state'));
  assert.ok(ingredients.description!.includes('Do not put preparation state in ingredient names or IDs'));
  assert.equal(schemaObject(ingredient.properties!.id).pattern, '^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$');
  assert.equal(component.additionalProperties, false);
  assert.deepEqual(component.required, ['id', 'steps']);
  assert.equal(schemaObject(component.properties!.depends_on).uniqueItems, true);
  const steps = schemaObject(component.properties!.steps);
  assert.equal(steps.minItems, 1);
  const step = schemaObject(steps.items);
  assert.equal(step.additionalProperties, false);
  const text = schemaObject(step.properties!.text);
  assert.equal(text.format, 'recipier-template-v1');
  const grammar = text.description!;
  const sections = ['## Generic format', '## Ingredient references (`i`)', '## Component references (`c`)'];
  for (const [index, section] of sections.entries()) {
    assert.ok(grammar.includes(section), section);
    if (index > 0) assert.ok(grammar.indexOf(sections[index - 1]) < grammar.indexOf(section));
  }
  assert.ok(!grammar.includes('EBNF'));
  assert.ok(!grammar.includes('$${'), 'The old dollar escape must not be advertised.');
  for (const reference of ['${kind:id[:amount[:unit]]}', '${i:butter}', '${i:egg:2}', '${i:butter:100:g}', '${c:sauce}', '${c:dumpling:4}', '${c:sauce:100:ml}', '\\${i:not-a-reference}']) {
    assert.ok(grammar.includes(reference), reference);
  }
  assert.ok(grammar.includes('Do not put preparation state in ingredient names or IDs'));
  assert.ok(grammar.includes('Add ${i:garlic:10:g}, minced.'));
  assert.ok(grammar.includes('Add ${i:garlic:2:cloves} whole.'));
  assert.ok(grammar.includes('Do not add a state segment to the reference or put state into the unit'));
  assert.ok(grammar.includes('quantified references with the same ingredient ID and exact unit are additive'));
  assert.ok(grammar.includes('the second reference does not add another 100 g'));
  assert.ok(grammar.includes('Component-reference quantities do not scale ingredient calculations'));
  assert.ok(grammar.includes('"depends_on": ["buttercream", "cake-layers"]'));
  const yieldDefinition = schemaObject(properties.yield);
  assert.equal(yieldDefinition.additionalProperties, false);
  assert.equal(schemaObject(yieldDefinition.properties!.amount).exclusiveMinimum, 0);
  assert.equal(schemaObject(yieldDefinition.properties!.unit).minLength, 1);
});

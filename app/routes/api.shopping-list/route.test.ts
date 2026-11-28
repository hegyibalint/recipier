import assert from 'node:assert/strict';
import { test } from 'vitest';
import { api, assertOwner, id, range, page, recipe, source } from '../../../tests/support/api.ts';
import { loader } from './route.ts';

test('shopping list embeds recipes using direct filters, scales usages, and never traverses component references', async () => {
  const handler = api(loader, request => {
    const url = assertOwner(request, 'meal_plan_entries');
    assert.equal(url.searchParams.get('select'), 'recipe_id,multiplier,recipe:recipes!meal_plan_entries_recipe_owner_fkey(document)');
    assert.deepEqual(url.searchParams.getAll('date'), ['gte.' + range.from, 'lt.' + range.to]);
    return page([source(0.5), source(2)]);
  });
  const response = await handler.request({ method: 'POST', payload: range });
  assert.equal(response.status, 200);
  const expected = (multiplier: number) => [
    { id: 'garlic', name: 'fresh Garlic', description: 'Whole bulb', amount: 6 * multiplier, unit: 'cloves' },
    { id: 'garlic', name: 'fresh Garlic', description: 'Whole bulb', amount: 20 * multiplier, unit: 'g' },
    { id: 'salt', name: '  salt to taste  ', amount: null, unit: null },
    { id: 'garlic', name: 'fresh Garlic', description: 'Whole bulb', amount: null, unit: null },
    { id: 'garlic', name: 'fresh Garlic', description: 'Whole bulb', amount: multiplier, unit: null },
  ];
  assert.deepEqual(await response.json(), {
    items: [...expected(0.5), ...expected(2)].map(item => ({ ...item, source: { id, title: recipe.title } })),
  });
});

test('shopping list follows capped pages and handles an empty range', async () => {
  let empty = false;
  const handler = api(loader, (request, number) => {
    if (empty) return page([]);
    assert.equal(new URL(request.url).searchParams.get('offset'), String(number - 1));
    return page([source()], 2);
  });
  assert.equal((await (await handler.request({ method: 'POST', payload: range })).json()).items.length, 10);
  empty = true;
  assert.deepEqual(await (await handler.request({ method: 'POST', payload: range })).json(), { items: [] });
});

test('invalid recipes, missing counts, numeric overflow, and incomplete pages never return partial lists', async () => {
  let response: Response;
  const handler = api(loader, () => response);
  for (response of [
    page([source(1, {})]), page([{ multiplier: 1, recipe: null }]), page([source(Number.MAX_VALUE)]),
    page([], 1), page([source()], 0), Response.json([source()]), new Response('private upstream error', { status: 500 }),
  ]) {
    const result = await handler.request({ method: 'POST', payload: range });
    assert.equal(result.status, 502);
    assert.doesNotMatch(await result.text(), /private upstream|fresh Garlic/);
  }
});

test('late database failures fail the entire shopping request', async () => {
  const handler = api(loader, (_request, number) => number === 1
    ? page([source()], 2) : new Response('private details', { status: 503 }));
  const result = await handler.request({ method: 'POST', payload: range });
  assert.equal(result.status, 502);
  assert.equal(handler.calls.length, 2);
  assert.doesNotMatch(await result.text(), /fresh Garlic|private details/);
});

test('JSON media type, body syntax, and strict range validation fail before storage', async () => {
  const handler = api(loader);
  assert.equal((await handler.request({ method: 'POST', body: '{}' })).status, 415);
  assert.equal((await handler.request({ method: 'POST', body: '{', headers: { 'Content-Type': 'application/json' } })).status, 400);
  for (const payload of [{}, { ...range, extra: true }, { ...range, to: range.from }]) {
    assert.equal((await handler.request({ method: 'POST', payload })).status, 400);
  }
  assert.equal(handler.calls.length, 0);
});

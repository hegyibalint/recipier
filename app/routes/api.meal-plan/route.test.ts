import assert from 'node:assert/strict';
import { test } from 'vitest';
import { api, assertOwner, owner, id, range, entry, page } from '../../../tests/support/api.ts';
import { loader } from './route.ts';

test('meal-plan GET uses direct date filters, not an RPC, and returns every page', async () => {
  const handler = api(loader, (request, number) => {
    const url = assertOwner(request, 'meal_plan_entries');
    assert.deepEqual(url.searchParams.getAll('date'), ['gte.' + range.from, 'lt.' + range.to]);
    assert.equal(url.searchParams.get('order'), 'date.asc,id.asc');
    return page([{ id: String(number), ...entry, multiplier: 1 }], 2);
  });
  const response = await handler.request({ query: '?' + new URLSearchParams(range) });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).entries.length, 2);
});

test('range queries reject missing, invalid, duplicate, reversed, equal, and unknown parameters', async () => {
  const handler = api(loader);
  for (const query of [
    '', '?from=' + range.from, '?from=2026-02-29&to=' + range.to,
    '?from=' + range.to + '&to=' + range.from, '?from=' + range.from + '&to=' + range.from,
    '?from=2026-11-09T00:00:00Z&to=' + range.to,
    '?' + new URLSearchParams(range) + '&from=' + range.from,
    '?' + new URLSearchParams(range) + '&user_id=' + owner,
  ]) assert.equal((await handler.request({ query })).status, 400, query);
  assert.equal(handler.calls.length, 0);
});

test('entry creation defaults to one batch and permits repeated assignments', async () => {
  const handler = api(loader, async request => {
    assert.deepEqual(await request.json(), { ...entry, multiplier: 1, user_id: owner });
    return Response.json({ id, ...entry, multiplier: 1 });
  });
  for (let i = 0; i < 2; i++) {
    const response = await handler.request({ method: 'POST', payload: entry });
    assert.equal(response.status, 201);
  }
  assert.equal(handler.calls.length, 2);
});

test('entry input rejects invalid references, multipliers, timestamps, and supplied ownership', async () => {
  const handler = api(loader);
  for (const payload of [
    { ...entry, multiplier: 0 }, { ...entry, multiplier: -1 }, { ...entry, multiplier: '2' },
    { ...entry, multiplier: null }, { ...entry, recipe_id: 'unknown' },
    { ...entry, date: '2026-11-09T18:00:00Z' }, { ...entry, user_id: owner },
  ]) assert.equal((await handler.request({ method: 'POST', payload })).status, 400);
  assert.equal(handler.calls.length, 0);
});

import assert from 'node:assert/strict';
import { test } from 'vitest';
import { api, assertOwner, owner, id, meal, page, token } from '../../../tests/support/api.ts';
import { loader } from './route.ts';

test('mealtime list follows all pages and forwards the verified session and owner filter', async () => {
  const session = token();
  const handler = api(loader, (request, number) => {
    const url = assertOwner(request, 'mealtimes');
    assert.equal(url.searchParams.get('offset'), String(number - 1));
    assert.equal(url.searchParams.get('order'), 'starts_at.asc,id.asc');
    assert.equal(request.headers.get('Authorization'), 'Bearer ' + session);
    assert.equal(request.headers.get('Prefer'), 'count=exact');
    assert.equal(url.searchParams.get('select'), 'id,name,starts_at,ends_at,created_at,planned_meals:meal_plan_entries!meal_plan_entries_mealtime_owner_fkey(count)');
    return page([{ id: String(number), ...meal, planned_meals: [{ count: number === 1 ? 1001 : 0 }] }], 2);
  });
  const response = await handler.request({ auth: session });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.deepEqual(await response.json(), { mealtimes: [
    { id: '1', ...meal, planned_meals_count: 1001 }, { id: '2', ...meal, planned_meals_count: 0 },
  ] });
});

test('missing or malformed usage aggregates fail the list instead of understating deletion impact', async () => {
  for (const planned_meals of [undefined, [], [{ count: -1 }], [{ count: 0.5 }], [{ count: '2' }], [{ count: 1 }, { count: 2 }]]) {
    const handler = api(loader, () => page([{ id, ...meal, planned_meals }]));
    const response = await handler.request();
    assert.equal(response.status, 502);
    assert.doesNotMatch(await response.text(), /mealtimes|planned_meals/);
  }
});

test('mealtime creation accepts local minute times, derives ownership, and returns 201', async () => {
  const handler = api(loader, async request => {
    assert.equal(request.method, 'POST');
    assert.deepEqual(await request.json(), { ...meal, user_id: owner });
    return Response.json({ id, ...meal });
  });
  const response = await handler.request({ method: 'POST', payload: { ...meal, starts_at: '18:00:00' } });
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { id, ...meal });
});

test('mealtime inputs reject blank names, overnight windows, invalid times, and ownership fields', async () => {
  const handler = api(loader);
  for (const payload of [
    {}, { ...meal, name: ' \n ' }, { ...meal, starts_at: '21:00' }, { ...meal, ends_at: '24:00' },
    { ...meal, ends_at: '20:00:01' }, { ...meal, starts_at: '18:00Z' },
    { ...meal, user_id: owner }, { ...meal, id }, { ...meal, planned_meals_count: 99 },
  ]) assert.equal((await handler.request({ method: 'POST', payload })).status, 400, JSON.stringify(payload));
  assert.equal(handler.calls.length, 0);
});

import assert from 'node:assert/strict';
import { test } from 'vitest';
import { api, assertOwner, owner, id, meal, page, token } from '../../../tests/support/api.ts';
import { loader } from './route.ts';

test('mealtime list follows all pages and forwards the verified session and owner filter', async () => {
  const session = token();
  const handler = api(loader, (request, number) => {
    const url = assertOwner(request, 'mealtimes');
    assert.equal(url.searchParams.get('offset'), String(number - 1));
    assert.equal(url.searchParams.get('order'), 'position.asc,id.asc');
    assert.equal(request.headers.get('Authorization'), 'Bearer ' + session);
    assert.equal(request.headers.get('Prefer'), 'count=exact');
    assert.equal(url.searchParams.get('select'), 'id,name,position,created_at,planned_meals:meal_plan_entries!meal_plan_entries_mealtime_owner_fkey(count)');
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

test('mealtime creation accepts a name, derives ownership, and returns the appended position', async () => {
  const handler = api(loader, async request => {
    assert.equal(request.method, 'POST');
    assert.deepEqual(await request.json(), { name: meal.name, user_id: owner });
    return Response.json({ id, ...meal });
  });
  const response = await handler.request({ method: 'POST', payload: { name: ' Dinner ' } });
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { id, ...meal });
});

test('mealtime creation rejects blank names, old time fields, and server-managed fields', async () => {
  const handler = api(loader);
  const input = { name: meal.name };
  for (const payload of [
    {}, { name: ' \n ' }, { ...input, starts_at: '21:00' }, { ...input, position: 1 },
    { ...input, user_id: owner }, { ...input, id }, { ...input, planned_meals_count: 99 },
  ]) assert.equal((await handler.request({ method: 'POST', payload })).status, 400, JSON.stringify(payload));
  assert.equal(handler.calls.length, 0);
});

test('reorder uses the verified session and sends the complete order in one RPC', async () => {
  const auth = token();
  const ids = [id, '00000000-0000-4000-8000-000000000003'];
  const handler = api(loader, async request => {
    assert.equal(new URL(request.url).pathname, '/rest/v1/rpc/reorder_mealtimes');
    assert.equal(request.headers.get('Authorization'), 'Bearer ' + auth);
    assert.deepEqual(await request.json(), { mealtime_ids: ids });
    return new Response(null, { status: 204 });
  });
  assert.equal((await handler.request({ auth, method: 'PATCH', payload: { ids } })).status, 204);
  for (const payload of [{ ids: [id, id] }, { ids: ['invalid'] }, { ids, user_id: owner }]) {
    assert.equal((await handler.request({ auth, method: 'PATCH', payload })).status, 400);
  }
  assert.equal(handler.calls.length, 1);
});

test('a changed mealtime list reports a conflict', async () => {
  const handler = api(loader, () => Response.json({ code: 'PT409' }, { status: 409 }));
  const response = await handler.request({ method: 'PATCH', payload: { ids: [id] } });
  assert.equal(response.status, 409);
  assert.match(await response.text(), /mealtime_order_conflict/);
});

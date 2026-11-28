import assert from 'node:assert/strict';
import { test } from 'vitest';
import { api, assertOwner, id, owner, page, token } from '../../../tests/support/api';
import { action, loader } from './route';

const ingredient = { name: 'Ice', original_name: null, description: null, quantities: [{ amount: 2, unit: 'bags' }] };
const item = { id, ...ingredient };

test('lists just the verified owner’s extra ingredients in creation order', async () => {
  const handler = api(loader, request => {
    const url = assertOwner(request, 'shopping_list_extras');
    assert.equal(url.searchParams.get('order'), 'created_at.asc,id.asc');
    return page([item]);
  });
  const response = await handler.request();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { items: [item] });
});

test('adds a structured ingredient and derives its owner from the session', async () => {
  const handler = api(action, async request => {
    assert.equal(request.method, 'POST');
    assert.equal(new URL(request.url).pathname, '/rest/v1/shopping_list_extras');
    assert.deepEqual(await request.json(), { ...ingredient, user_id: owner });
    return Response.json(item);
  });
  const response = await handler.request({ method: 'POST', payload: { name: ' Ice ', quantities: [{ amount: 2, unit: ' bags ' }] } });
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), item);
  for (const payload of [{ name: ' ' }, { name: 'ice\nlemons' }, { name: 'Ice', user_id: id },
    { name: 'Ice', quantities: [{ amount: 0, unit: 'bags' }] }]) {
    assert.equal((await handler.request({ method: 'POST', payload })).status, 400);
  }
  assert.equal(handler.calls.length, 1);
});

test('edits only the requested item belonging to the owner and clears omitted optional fields', async () => {
  const updated = { name: 'Lemons', original_name: null, description: null, quantities: [] };
  const handler = api(action, async request => {
    const url = assertOwner(request, 'shopping_list_extras');
    assert.equal(request.method, 'PATCH');
    assert.equal(url.searchParams.get('id'), 'eq.' + id);
    assert.deepEqual(await request.json(), updated);
    return Response.json([{ id, ...updated }]);
  });
  const response = await handler.request({ method: 'PATCH', payload: { id, name: 'Lemons' } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { id, ...updated });
});

test('removes only the requested item belonging to the owner', async () => {
  const handler = api(action, request => {
    const url = assertOwner(request, 'shopping_list_extras');
    assert.equal(request.method, 'DELETE');
    assert.equal(url.searchParams.get('id'), 'eq.' + id);
    return Response.json({ id });
  });
  assert.equal((await handler.request({ method: 'DELETE', payload: { id } })).status, 204);
  assert.equal((await handler.request({ method: 'DELETE', payload: { id: 'invalid' } })).status, 400);
  assert.equal(handler.calls.length, 1);
});

test('the browser API requires the allowed browser session', async () => {
  const handler = api(loader);
  assert.equal((await handler.request({ auth: null })).status, 401);
  assert.equal((await handler.request({ auth: token({ sub: id }) })).status, 403);
  assert.equal((await handler.request({ auth: token({ client_id: id }) })).status, 403);
  assert.equal(handler.calls.length, 0);
});

import assert from 'node:assert/strict';
import { test } from 'vitest';
import { api, assertOwner, id } from '../../../tests/support/api.ts';
import { loader } from './route.ts';

const route = 'mealtimes';
const table = 'mealtimes';

test(route + ' PATCH and DELETE target only the requested owned row', async () => {
  const patch = { name: 'Lunch' };
  const handler = api(loader, async request => {
    const url = assertOwner(request, table);
    assert.equal(url.searchParams.get('id'), 'eq.' + id);
    if (request.method === 'PATCH') assert.deepEqual(await request.json(), patch);
    return Response.json({ id, ...patch });
  });
  const updated = await handler.request({ method: 'PATCH', payload: patch, params: { id } });
  assert.equal(updated.status, 200);
  assert.deepEqual(await updated.json(), { id, ...patch });
  const deleted = await handler.request({ method: 'DELETE', params: { id } });
  assert.equal(deleted.status, 204);
  assert.equal(await deleted.text(), '');
});

test(route + ' invalid IDs/empty patches never query; inaccessible rows are 404', async () => {
  const handler = api(loader, () => Response.json(null));
  assert.equal((await handler.request({ method: 'DELETE', params: { id: 'invalid' } })).status, 400);
  assert.equal((await handler.request({ method: 'PATCH', payload: {}, params: { id } })).status, 400);
  assert.equal(handler.calls.length, 0);
  assert.equal((await handler.request({ method: 'DELETE', params: { id } })).status, 404);
});

test('database constraints and protected references produce safe 400/409 responses', async () => {
  let code = '23503';
  const handler = api(loader, () => Response.json({ code, message: 'private SQL details' }, { status: 400 }));
  let response = await handler.request({ method: 'DELETE', params: { id } });
  assert.equal(response.status, 409);
  assert.doesNotMatch(await response.text(), /private SQL/);
  code = '23514';
  response = await handler.request({ method: 'PATCH', payload: { name: 'Lunch' }, params: { id } });
  assert.equal(response.status, 400);
});

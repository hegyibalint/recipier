import assert from 'node:assert/strict';
import { test } from 'vitest';
import { config, mockMcp, readRpc, rpc, token } from '../../../../tests/support/mcp';

const id = '00000000-0000-4000-8000-000000000012';
const ingredient = {
  name: 'Ice', original_name: '氷', description: 'For drinks',
  quantities: [{ amount: 2, unit: 'bags' }, { amount: 500, unit: 'g' }],
};
const item = { id, ...ingredient };

test('MCP discovers and uses the three extra ingredient tools with the caller JWT', async () => {
  const bearer = await token();
  const requests: Request[] = [];
  const handle = mockMcp({ storage: async (input, init) => {
    const request = new Request(input, init);
    requests.push(request);
    const url = new URL(request.url);
    assert.equal(url.pathname, '/rest/v1/shopping_list_extras');
    assert.equal(request.headers.get('Authorization'), 'Bearer ' + bearer);
    if (request.method === 'POST') {
      assert.deepEqual(await request.json(), { ...ingredient, user_id: config.userId });
      return Response.json(item);
    }
    assert.equal(url.searchParams.get('user_id'), 'eq.' + config.userId);
    if (request.method === 'DELETE') {
      assert.equal(url.searchParams.get('id'), 'eq.' + id);
      return Response.json([{ id }]);
    }
    assert.equal(request.method, 'GET');
    return Response.json([item], { headers: { 'Content-Range': '0-0/1' } });
  } });
  const { result: { tools } } = await readRpc(await handle(rpc('tools/list', bearer)));
  const adhoc = tools.filter((tool: { name: string }) => tool.name.includes('adhoc'));
  assert.deepEqual(adhoc.map((tool: { name: string; annotations: { destructiveHint: boolean } }) =>
    [tool.name, tool.annotations.destructiveHint]), [
    ['list_adhoc_ingredients', false], ['add_adhoc_ingredient', false], ['remove_adhoc_ingredient', true],
  ]);

  const call = async (name: string, args?: object) => {
    const { result } = await readRpc(await handle(rpc('tools/call', bearer, { name, arguments: args })));
    assert.equal(result.isError, false);
    return result.structuredContent;
  };
  assert.deepEqual(await call('add_adhoc_ingredient', { ...ingredient, name: ' Ice ' }), { item });
  assert.deepEqual(await call('list_adhoc_ingredients'), { items: [item] });
  assert.deepEqual(await call('remove_adhoc_ingredient', { id }), { id });
  assert.equal(requests.length, 3);
});

test('invalid or caller-scoped arguments do not reach storage', async () => {
  let requests = 0;
  const handle = mockMcp({ storage: async () => { requests++; return Response.json(null); } });
  const bearer = await token();
  for (const [name, args] of [
    ['list_adhoc_ingredients', { user_id: config.userId }],
    ['add_adhoc_ingredient', { name: 'Ice', quantities: [{ amount: -1, unit: null }] }],
    ['add_adhoc_ingredient', { name: 'Ice', user_id: config.userId }],
    ['remove_adhoc_ingredient', { id: 'invalid' }],
  ]) {
    const response = await readRpc(await handle(rpc('tools/call', bearer, { name, arguments: args })));
    assert.ok(response.error || response.result?.isError);
  }
  assert.equal(requests, 0);
});

test('storage failures and unavailable removals do not appear successful', async () => {
  const handle = mockMcp({ storage: async (_input, init) => init?.method === 'DELETE'
    ? Response.json([]) : new Response('Private database detail', { status: 502 }) });
  const bearer = await token();
  for (const [name, args, error] of [
    ['list_adhoc_ingredients', {}, 'Extra ingredients could not be loaded. Please try again.'],
    ['remove_adhoc_ingredient', { id }, 'This extra ingredient is not available.'],
  ]) {
    const { result } = await readRpc(await handle(rpc('tools/call', bearer, { name, arguments: args })));
    assert.equal(result.isError, true);
    assert.deepEqual(result.structuredContent, { error });
  }
});

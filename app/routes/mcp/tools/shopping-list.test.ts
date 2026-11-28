import assert from 'node:assert/strict';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { test } from 'vitest';
import { config, resource, mockMcp, token, rpc, readRpc } from '../../../../tests/support/mcp.ts';

const range = { from: '2026-11-09', to: '2026-11-16' };
const recipe = {
  title: 'Cabbage soup', subtitle: 'With chopped cabbage', description: 'A simple soup.',
  ingredients: [{ id: 'cabbage', name: 'Cabbage' }, { id: 'salt', name: 'Salt' }],
  components: [{ id: 'soup', steps: [{ text: 'Add ${i:cabbage:1:heads}, ${i:cabbage:125:g} and ${i:salt}.' }] }],
};
const row = { recipe_id: '00000000-0000-4000-8000-000000000002', multiplier: 1, recipe: { document: recipe } };

test('the MCP client reads grouped ingredients across every page with the caller JWT and date bounds', async () => {
  const bearer = await token();
  const reads: Request[] = [];
  const handle = mockMcp({ storage: async (input, init) => {
    reads.push(new Request(input, init));
    const description = reads.length === 1 ? 'Soft tofu' : 'Hard tofu';
    const document = {
      ...recipe,
      ingredients: [...recipe.ingredients, { id: 'tofu', name: 'Tofu', description, original_name: reads.length === 1 ? '嫩豆腐' : '硬豆腐' }],
      components: [{ id: 'soup', steps: [
        ...recipe.components[0].steps, { text: `Add \${i:tofu:${reads.length === 1 ? 300 : 400}:g}.` },
      ] }],
    };
    return Response.json([{ ...row, recipe: { document } }], {
      headers: { 'Content-Range': `${reads.length - 1}-${reads.length - 1}/2` },
    });
  } });
  const client = new Client({ name: 'shopping-list-test', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL(resource), {
    requestInit: { headers: { Authorization: 'Bearer ' + bearer } },
    fetch: (input, init) => handle(new Request(input, init)),
  });
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    const tool = tools.find(tool => tool.name === 'get_shopping_list');
    assert.ok(tool);
    assert.equal(tool.annotations?.readOnlyHint, true);
    assert.deepEqual(tool.inputSchema.required, ['from', 'to']);
    assert.match(tool.description ?? '', /inclusive.*exclusive/);

    const result = await client.callTool({ name: tool.name, arguments: range });
    assert.equal(result.isError, false);
    const cabbage = { name: 'Cabbage', quantities: [{ amount: 2, unit: 'heads' }, { amount: 250, unit: 'g' }], hasUnquantifiedMentions: false };
    const salt = { name: 'Salt', quantities: [], hasUnquantifiedMentions: true };
    assert.deepEqual(result.structuredContent, { items: [
      { id: 'cabbage', ...cabbage },
      { id: 'salt', ...salt },
      { id: 'tofu', name: 'Tofu', description: 'Soft tofu', original_names: ['嫩豆腐'], quantities: [{ amount: 300, unit: 'g' }], hasUnquantifiedMentions: false },
      { id: 'tofu', name: 'Tofu', description: 'Hard tofu', original_names: ['硬豆腐'], quantities: [{ amount: 400, unit: 'g' }], hasUnquantifiedMentions: false },
    ] });
    assert.ok(Array.isArray(result.content));
    const [content] = result.content;
    assert.equal(content.type, 'text');
    assert.deepEqual(JSON.parse(content.text), result.structuredContent);

    assert.equal(reads.length, 2);
    reads.forEach((request, index) => {
      const url = new URL(request.url);
      assert.equal(request.method, 'GET');
      assert.equal(url.pathname, '/rest/v1/meal_plan_entries');
      assert.equal(url.searchParams.get('user_id'), 'eq.' + config.userId);
      assert.deepEqual(url.searchParams.getAll('date'), ['gte.' + range.from, 'lt.' + range.to]);
      assert.equal(url.searchParams.get('offset'), String(index));
      assert.equal(request.headers.get('Authorization'), 'Bearer ' + bearer);
    });
  } finally {
    await client.close();
  }
});

test('invalid dates and caller-supplied ownership are rejected before storage', async () => {
  let reads = 0;
  const handle = mockMcp({ storage: async () => {
    reads++;
    return Response.json([]);
  } });
  const bearer = await token();
  for (const args of [{ ...range, user_id: 'other' }, { ...range, to: range.from }, { ...range, from: '2026-02-30' }]) {
    const response = await readRpc(await handle(rpc('tools/call', bearer, { name: 'get_shopping_list', arguments: args })));
    assert.ok(response.error || response.result?.isError);
  }
  assert.equal(reads, 0);
});

test('empty plans and storage failures return distinguishable results', async () => {
  let response = Response.json([], { headers: { 'Content-Range': '*/0' } });
  const handle = mockMcp({ storage: async () => response });
  const bearer = await token();
  async function call() {
    const { result } = await readRpc(await handle(rpc('tools/call', bearer, { name: 'get_shopping_list', arguments: range })));
    return result;
  }

  const empty = await call();
  assert.equal(empty.isError, false);
  assert.deepEqual(empty.structuredContent, { items: [] });

  response = new Response('private database detail', { status: 500 });
  const failed = await call();
  assert.equal(failed.isError, true);
  assert.deepEqual(failed.structuredContent, { error: 'Shopping list could not be loaded. Please try again.' });
  assert.doesNotMatch(JSON.stringify(failed), /private database detail/);
});

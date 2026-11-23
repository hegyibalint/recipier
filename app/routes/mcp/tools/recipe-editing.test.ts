import assert from 'node:assert/strict';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { test } from 'vitest';
import { config, resource, mockMcp, token, rpc, readRpc } from '../../../../tests/support/mcp.ts';
import { example } from '../../../../tests/support/recipe-example.ts';

const recipeId = '143e33aa-dcb8-489b-b7b4-d7f1fc21ae3f';

test('MCP reads a snapshot, saves the next version, and refetches after a conflict', async () => {
  const bearer = await token();
  let current = { recipe_id: recipeId, version: 1, recipe: example };
  const calls: string[] = [];
  const handle = mockMcp({
    storage: async (input, init) => {
      const request = new Request(input, init);
      const url = new URL(request.url);
      calls.push(`${request.method} ${url.pathname}`);
      assert.equal(request.headers.get('Authorization'), 'Bearer ' + bearer);
      if (request.method === 'GET') {
        assert.equal(url.searchParams.get('id'), `eq.${recipeId}`);
        assert.equal(url.searchParams.get('user_id'), `eq.${config.userId}`);
        assert.equal(url.searchParams.get('select'), 'id,version,document');
        return Response.json([{ id: recipeId, version: current.version, document: current.recipe }]);
      }
      const { recipe_id, base_version, recipe, ...extra } = await request.json();
      assert.equal(recipe_id, recipeId);
      assert.deepEqual(extra, {});
      if (base_version !== current.version) return Response.json({ error: 'version_conflict' });
      current = { recipe_id, version: base_version + 1, recipe };
      return Response.json(current);
    },
  });
  const client = new Client({ name: 'recipe-editing-test', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL(resource), {
    requestInit: { headers: { Authorization: 'Bearer ' + bearer } },
    fetch: (input, init) => handle(new Request(input, init)),
  });
  const get = () => client.callTool({ name: 'get_recipe', arguments: { recipe_id: recipeId } });
  const update = (base_version: unknown, recipe: object) => client.callTool({
    name: 'update_recipe', arguments: { recipe_id: recipeId, base_version, recipe },
  });
  try {
    await client.connect(transport);
    const first = await get();
    assert.equal(first.isError, false);
    assert.deepEqual(first.structuredContent, current);
    assert.ok(Array.isArray(first.content));
    const content = first.content[0];
    assert.equal(content.type, 'text');
    assert.deepEqual(JSON.parse(content.text), first.structuredContent);

    const renamed = { ...example, title: 'New title' };
    const saved = await update(first.structuredContent?.version, renamed);
    assert.equal(saved.isError, false);
    assert.deepEqual(saved.structuredContent, { recipe_id: recipeId, version: 2, recipe: renamed });

    const description = 'A revised description.';
    for (const baseVersion of [first.structuredContent?.version, 99]) {
      const rejected = await update(baseVersion, { ...example, description });
      assert.equal(rejected.isError, true);
      assert.deepEqual(rejected.structuredContent, {
        error: 'version_conflict', message: 'Call get_recipe and reapply the requested changes to the latest recipe.',
      });
    }
    const latest = await get();
    assert.deepEqual(latest.structuredContent, saved.structuredContent);
    const rebased = { ...(latest.structuredContent?.recipe as typeof example), description };
    const updated = await update(latest.structuredContent?.version, rebased);
    assert.equal(updated.isError, false);
    assert.deepEqual(updated.structuredContent, { recipe_id: recipeId, version: 3, recipe: { ...renamed, description } });
    assert.deepEqual(calls, [
      'GET /rest/v1/recipes', 'POST /rest/v1/rpc/update_recipe',
      'POST /rest/v1/rpc/update_recipe', 'POST /rest/v1/rpc/update_recipe',
      'GET /rest/v1/recipes', 'POST /rest/v1/rpc/update_recipe',
    ]);
  } finally {
    await client.close();
  }
});

test('update_recipe rejects invalid versions, caller-supplied target versions, and invalid recipe references before writing', async () => {
  let writes = 0;
  const handle = mockMcp({
    storage: () => {
      writes++;
      throw new Error('Storage must not be called.');
    },
  });
  const bearer = await token();
  const args = { recipe_id: recipeId, base_version: 1, recipe: example };
  for (const invalid of [
    { ...args, base_version: undefined }, { ...args, base_version: '1' },
    { ...args, base_version: 0 }, { ...args, base_version: 1.5 }, { ...args, version: 2 },
    { ...args, recipe: { ...example, components: [{ id: 'main', steps: [{ text: '${i:missing}' }] }] } },
  ]) {
    const response = await readRpc(await handle(rpc('tools/call', bearer, { name: 'update_recipe', arguments: invalid })));
    assert.ok(response.error || response.result?.isError);
  }
  assert.equal(writes, 0);
});

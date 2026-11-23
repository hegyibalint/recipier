import assert from 'node:assert/strict';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { test } from 'vitest';
import { config, resource, frontend, mockMcp, token, rpc, readRpc } from '../../../../tests/support/mcp.ts';
import { example } from '../../../../tests/support/recipe-example.ts';
import { recipeJsonSchema } from '../../../lib/recipes/schema.ts';

test('tool listing exposes recipe creation with write annotations alongside recipe listing', async () => {
  const handle = mockMcp();
  const { result } = await readRpc(await handle(rpc('tools/list', await token())));
  assert.deepEqual(result.tools.map((tool: { name: string }) => tool.name), ['create_recipe', 'list_recipes', 'get_recipe', 'update_recipe']);
  assert.deepEqual(result.tools[0].annotations, {
    readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false,
  });
  assert.deepEqual(result.tools[0].inputSchema, recipeJsonSchema);
  assert.deepEqual(result.tools[0].inputSchema.required, ['title', 'subtitle', 'description', 'ingredients', 'components']);
  assert.ok(result.tools[0].description.includes('only when the user explicitly asks to save a recipe'));
  for (const tool of result.tools) assert.deepEqual(tool._meta.securitySchemes, [{ type: 'oauth2', scopes: [] }]);
});

test('authenticated tool listings are private and never expose the token', async () => {
  const handle = mockMcp();
  const bearer = await token();
  const response = await handle(rpc('tools/list', bearer));
  assert.ok(response.headers.get('Cache-Control')?.includes('no-store'));
  const { result } = await readRpc(response);
  assert.ok(!JSON.stringify(result).includes(bearer));
});

test('rejects unknown tools and unexpected arguments', async () => {
  const handle = mockMcp();
  for (const params of [
    { name: 'delete_everything', arguments: {} },
    { name: 'who_am_i', arguments: {} },
    { name: 'create_recipe', arguments: { ...example, user_id: 'someone-else' } },
  ]) {
    const result = await readRpc(await handle(rpc('tools/call', await token(), params)));
    assert.ok(result.error || result.result?.isError);
  }
});

test('rejects an untrusted browser origin', async () => {
  const handle = mockMcp();
  const response = await handle(rpc('tools/list', await token(), {}, { Origin: 'https://evil.example' }));
  assert.equal(response.status, 403);
});

test('official MCP client receives recipe metadata and saves as the verified user', async () => {
  const bearer = await token();
  const inserts: Request[] = [];
  const recipeId = '143e33aa-dcb8-489b-b7b4-d7f1fc21ae3f';
  const createdAt = '2026-10-31T23:00:00Z';
  const storageHandle = mockMcp({
    storage: async (input, init) => {
      inserts.push(new Request(input, init));
      return Response.json({ id: recipeId, created_at: createdAt }, { status: 201 });
    },
  });
  const client = new Client({ name: 'sdk-test', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL(resource), {
    requestInit: { headers: { Authorization: 'Bearer ' + bearer } },
    fetch: (input, init) => storageHandle(new Request(input, init)),
  });
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map(tool => tool.name), ['create_recipe', 'list_recipes', 'get_recipe', 'update_recipe']);
    const createRecipe = tools.find(tool => tool.name === 'create_recipe');
    assert.ok(createRecipe);
    assert.deepEqual(createRecipe.inputSchema, recipeJsonSchema,
      'All nested descriptions, reference examples, newlines and backslashes must reach the SDK client unchanged.');
    const { result: listing } = await readRpc(await storageHandle(rpc('tools/list', bearer)));
    const advertised = listing.tools.find((tool: { name: string }) => tool.name === 'create_recipe');
    assert.equal(typeof advertised.description, 'string');
    assert.ok(advertised.description.length > 0);
    assert.equal(createRecipe.description, advertised.description,
      'The tool description must also reach the SDK client unchanged.');
    assert.ok(createRecipe.description?.includes('recipe_url'));
    assert.deepEqual(createRecipe.outputSchema, advertised.outputSchema);
    assert.equal(advertised.outputSchema.properties.recipe_url.format, 'uri');
    const saved = await client.callTool({ name: 'create_recipe', arguments: example });
    assert.equal(saved.isError, false);
    assert.deepEqual(saved.structuredContent, {
      saved: true, recipe_id: recipeId, title: example.title, created_at: createdAt,
      recipe_url: frontend + '/recipes/' + recipeId,
    });
    assert.ok(Array.isArray(saved.content));
    const content = saved.content[0];
    assert.equal(content.type, 'text');
    assert.deepEqual(JSON.parse(content.text as string), saved.structuredContent);
    assert.equal(inserts.length, 1);
    assert.equal(new URL(inserts[0].url).pathname, '/rest/v1/recipes');
    assert.equal(new URL(inserts[0].url).searchParams.get('select'), 'id,created_at');
    assert.equal(inserts[0].headers.get('Accept'), 'application/vnd.pgrst.object+json');
    assert.equal(inserts[0].method, 'POST');
    assert.equal(inserts[0].headers.get('apikey'), 'sb_publishable_test');
    assert.equal(inserts[0].headers.get('Authorization'), 'Bearer ' + bearer);
    assert.ok(example.subtitle, 'The SDK call must exercise subtitle support.');
    assert.deepEqual(await inserts[0].json(), { user_id: config.userId, document: example });
    assert.ok(!JSON.stringify(saved).includes(bearer));
  } finally {
    await client.close();
  }
});

test('invalid recipes and caller-supplied ownership/IDs never reach storage', async () => {
  let inserts = 0;
  const storageHandle = mockMcp({
    storage: () => {
      inserts++;
      throw new Error('Storage should not be called.');
    },
  });
  for (const input of [
    { ...example, user_id: 'someone-else' },
    { ...example, recipe_id: 'caller-chosen-id' },
    { ...example, title: undefined },
    { ...example, ingredients: [] },
  ]) {
    const { result } = await readRpc(await storageHandle(rpc('tools/call', await token(), { name: 'create_recipe', arguments: input })));
    assert.equal(result.isError, true);
    assert.equal(result.structuredContent.saved, false);
    assert.equal(result.structuredContent.recipe_url, undefined);
    assert.ok(result.structuredContent.issues.length > 0);
    assert.ok(result.structuredContent.issues.every((issue: { code: string }) => issue.code !== 'storage_error'));
  }
  assert.equal(inserts, 0);
});

test('recipe saves require title, subtitle, and description before storage', async () => {
  let inserts = 0;
  const storageHandle = mockMcp({
    storage: () => {
      inserts++;
      throw new Error('Storage should not be called.');
    },
  });
  for (const field of ['title', 'subtitle', 'description']) {
    for (const value of [undefined, '', '   ', null, 42]) {
      const { result } = await readRpc(await storageHandle(rpc('tools/call', await token(), {
        name: 'create_recipe', arguments: { ...example, [field]: value },
      })));
      assert.equal(result.isError, true);
      assert.equal(result.structuredContent.saved, false);
      assert.ok(result.structuredContent.issues.some((issue: { path: string; code: string }) =>
        issue.path === '/' + field && issue.code !== 'storage_error'));
    }
  }
  assert.equal(inserts, 0);
});

test('recipe writes retain the same user, client, audience and origin checks', async () => {
  let inserts = 0;
  const storageHandle = mockMcp({
    storage: () => {
      inserts++;
      throw new Error('Storage should not be called.');
    },
  });
  for (const [claims, status] of [
    [{ sub: 'other-user' }, 403], [{ client_id: 'other-client' }, 403],
    [{ aud: 'authenticated' }, 401], [{ exp: 1 }, 401],
  ] as const) {
    const response = await storageHandle(rpc('tools/call', await token(claims), { name: 'create_recipe', arguments: example }));
    assert.equal(response.status, status);
  }
  const response = await storageHandle(rpc('tools/call', await token(), { name: 'create_recipe', arguments: example }, { Origin: 'https://evil.example' }));
  assert.equal(response.status, 403);
  assert.equal(inserts, 0);
});

test('storage failures never report a successful save or leak database details', async () => {
  const bearer = await token();
  for (const fetcher of [
    () => Promise.resolve(new Response('private database detail', { status: 500 })),
    () => Promise.resolve(Response.json([])),
    () => Promise.resolve(Response.json([{ id: 'missing-timestamp' }])),
    () => Promise.reject(new Error('private network detail')),
  ]) {
    const storageHandle = mockMcp({ storage: fetcher });
    const { result } = await readRpc(await storageHandle(rpc('tools/call', bearer, { name: 'create_recipe', arguments: example })));
    assert.equal(result.isError, true);
    assert.equal(result.structuredContent.saved, false);
    assert.equal(result.structuredContent.recipe_url, undefined);
    assert.equal(result.structuredContent.issues[0].code, 'storage_error');
    assert.ok(!JSON.stringify(result).includes('private'));
    assert.ok(!JSON.stringify(result).includes(bearer));
  }
  const unconfigured = mockMcp({ configuration: { ...config, publishableKey: '' } });
  assert.equal((await unconfigured(rpc('tools/call', bearer, { name: 'create_recipe', arguments: example }))).status, 503);
});

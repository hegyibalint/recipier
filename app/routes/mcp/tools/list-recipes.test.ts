import assert from 'node:assert/strict';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { test } from 'vitest';
import { config, resource, mockMcp, token, rpc, readRpc } from '../../../../tests/support/mcp.ts';

const summaries = [{ recipe_id: '143e33aa-dcb8-489b-b7b4-d7f1fc21ae3f', title: 'Chickpea bowls', subtitle: 'Roasted chickpeas with lemon yogurt' }];

test('list_recipes advertises no arguments and read-only, idempotent annotations', async () => {
  const handle = mockMcp();
  const { result } = await readRpc(await handle(rpc('tools/list', await token())));
  const tool = result.tools.find((tool: { name: string }) => tool.name === 'list_recipes');
  assert.ok(tool);
  assert.deepEqual(tool.inputSchema.properties, {});
  assert.equal(tool.inputSchema.additionalProperties, false);
  assert.deepEqual(tool.annotations, {
    readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false,
  });
  assert.deepEqual(tool._meta.securitySchemes, [{ type: 'oauth2', scopes: [] }]);
  assert.deepEqual(Object.keys(tool.outputSchema.properties.recipes.items.properties), ['recipe_id', 'title', 'subtitle']);
});

test('official MCP client lists summaries with the verified caller JWT and ownership filter', async () => {
  const bearer = await token();
  const reads: Request[] = [];
  const storageHandle = mockMcp({
    storage: async (input, init) => {
      reads.push(new Request(input, init));
      return Response.json(summaries, { headers: { 'Content-Range': '0-0/1' } });
    },
  });
  const client = new Client({ name: 'list-recipes-test', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL(resource), {
    requestInit: { headers: { Authorization: 'Bearer ' + bearer } },
    fetch: (input, init) => storageHandle(new Request(input, init)),
  });
  try {
    await client.connect(transport);
    const result = await client.callTool({ name: 'list_recipes', arguments: {} });
    assert.equal(result.isError, false);
    assert.deepEqual(result.structuredContent, { recipes: summaries });
    assert.ok(Array.isArray(result.content));
    assert.equal(result.content[0].type, 'text');
    assert.deepEqual(JSON.parse(result.content[0].text as string), result.structuredContent);
    assert.equal(reads.length, 1);
    const request = reads[0];
    const url = new URL(request.url);
    assert.equal(request.method, 'GET');
    assert.equal(url.pathname, '/rest/v1/recipes');
    assert.equal(url.searchParams.get('user_id'), 'eq.' + config.userId);
    assert.equal(url.searchParams.get('select'), 'recipe_id:id,title:document->>title,subtitle:document->>subtitle');
    assert.equal(request.headers.get('Authorization'), 'Bearer ' + bearer);
    assert.equal(request.headers.get('apikey'), config.publishableKey);
    assert.ok(!JSON.stringify(result).includes(bearer));
  } finally {
    await client.close();
  }
});

test('empty collections return a successful empty list, not a storage failure', async () => {
  const storageHandle = mockMcp({ storage: async () => Response.json([]) });
  const { result } = await readRpc(await storageHandle(rpc('tools/call', await token(), {
    name: 'list_recipes', arguments: {},
  })));
  assert.equal(result.isError, false);
  assert.deepEqual(result.structuredContent, { recipes: [] });
});

test('listing rejects caller-supplied ownership and other unexpected arguments before storage', async () => {
  let reads = 0;
  const storageHandle = mockMcp({
    storage: async () => {
      reads++;
      return Response.json(summaries);
    },
  });
  for (const args of [{ user_id: 'someone-else' }, { limit: 1 }, { query: 'bowls' }]) {
    const response = await readRpc(await storageHandle(rpc('tools/call', await token(), {
      name: 'list_recipes', arguments: args,
    })));
    assert.ok(response.error || response.result?.isError);
  }
  assert.equal(reads, 0);
});

test('list failures never masquerade as empty collections or expose storage details', async () => {
  const bearer = await token();
  for (const respond of [
    () => new Response('private database detail', { status: 500 }),
    () => Response.json(null),
    () => Response.json([{ title: 'Missing subtitle' }]),
    () => { throw new Error('private network detail'); },
  ]) {
    const storageHandle = mockMcp({ storage: async () => respond() });
    const { result } = await readRpc(await storageHandle(rpc('tools/call', bearer, {
      name: 'list_recipes', arguments: {},
    })));
    assert.equal(result.isError, true);
    assert.equal(result.structuredContent.recipes, undefined);
    assert.equal(result.structuredContent.error, 'Recipes could not be loaded. Please try again.');
    assert.ok(!JSON.stringify(result).includes('private'));
    assert.ok(!JSON.stringify(result).includes(bearer));
  }
});

test('listing retains user, client, audience, expiry, and origin authentication checks', async () => {
  let reads = 0;
  const storageHandle = mockMcp({
    storage: async () => {
      reads++;
      return Response.json(summaries);
    },
  });
  for (const [claims, status] of [
    [{ sub: 'other-user' }, 403], [{ client_id: 'other-client' }, 403],
    [{ aud: 'authenticated' }, 401], [{ exp: 1 }, 401],
  ] as const) {
    const response = await storageHandle(rpc('tools/call', await token(claims), { name: 'list_recipes', arguments: {} }));
    assert.equal(response.status, status);
  }
  const response = await storageHandle(rpc('tools/call', await token(), {
    name: 'list_recipes', arguments: {},
  }, { Origin: 'https://evil.example' }));
  assert.equal(response.status, 403);
  assert.equal(reads, 0);
});

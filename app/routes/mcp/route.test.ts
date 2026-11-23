import assert from 'node:assert/strict';
import { generateKeyPair, SignJWT } from 'jose';
import { beforeEach, test, vi } from 'vitest';
import { config, resource, frontend, issuer, handle, mockMcp, token, rpc, readRpc } from '../../../tests/support/mcp.ts';

beforeEach(() => { mockMcp(); });

test('anonymous requests receive the public discovery URL in their challenge', async () => {
  const response = await handle(new Request(resource));
  assert.equal(response.status, 401);
  assert.equal(response.headers.get('WWW-Authenticate'),
    'Bearer resource_metadata="' + frontend + '/.well-known/oauth-protected-resource/mcp"');
});

test('HEAD keeps the OAuth challenge and CORS headers without a body', async () => {
  const origin = 'https://chatgpt.com';
  const response = await handle(new Request(resource, { method: 'HEAD', headers: { Origin: origin } }));
  assert.equal(response.status, 401);
  assert.equal(response.body, null);
  assert.equal(response.headers.get('WWW-Authenticate'),
    'Bearer resource_metadata="' + frontend + '/.well-known/oauth-protected-resource/mcp"');
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
  assert.equal(response.headers.get('Vary'), 'Origin');
});

test('browser cookies and publishable keys are not MCP credentials', async () => {
  for (const headers of [{ Cookie: 'sb-session=forged' }, { Authorization: 'Bearer sb_publishable_test' }] as Record<string, string>[]) {
    assert.equal((await handle(new Request(resource, { headers }))).status, 401);
  }
});

for (const [name, claims] of [
  ['website token', { aud: 'authenticated' }],
  ['another resource', { aud: 'https://other.example/mcp' }],
  ['another issuer', { iss: 'https://other.supabase.co/auth/v1' }],
  ['expired token', { exp: 1 }],
  ['missing expiration', { exp: undefined }],
  ['missing subject', { sub: undefined }],
  ['future not-before', { nbf: Math.floor(Date.now() / 1000) + 3600 }],
  ['wrong role', { role: 'service_role' }],
  ['mixed audience', { aud: [resource, 'authenticated'] as string[] }],
  ['old Edge Function audience', { aud: config.supabaseUrl + '/functions/v1/mcp' }],
] as const) {
  test('rejects ' + name, async () => {
    const response = await handle(rpc('tools/list', await token(claims)));
    assert.equal(response.status, 401);
    assert.ok(response.headers.has('WWW-Authenticate'));
  });
}

for (const [name, claims] of [
  ['another user', { sub: 'other-user' }],
  ['another client', { client_id: 'other-client' }],
  ['missing client ID', { client_id: undefined }],
] as const) {
  test('forbids ' + name, async () => {
    assert.equal((await handle(rpc('tools/list', await token(claims)))).status, 403);
  });
}

test('rejects forged signatures and malformed tokens', async () => {
  const other = await generateKeyPair('ES256');
  for (const bearer of [await token({}, other.privateKey), 'not-a-token']) {
    assert.equal((await handle(rpc('tools/list', bearer))).status, 401);
  }
});

test('fails closed without configured IDs', async () => {
  for (const missing of [{ userId: '' }, { clientId: '' }, { publishableKey: '' }]) {
    const unconfigured = mockMcp({ configuration: { ...config, ...missing } });
    assert.equal((await unconfigured(rpc('tools/list', await token()))).status, 503);
  }
});

test('MCP requires a canonical HTTPS resource URL, independent of Supabase', async () => {
  for (const resourceUrl of ['', 'not-a-url', 'http://recipes.example/mcp', resource + '/',
    frontend + '/other', resource + '?query=value', resource + '#fragment',
    'https://user:password@recipes.example/mcp']) {
    const unconfigured = mockMcp({ configuration: { ...config, resourceUrl } });
    const response = await unconfigured(new Request(resource));
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  }
});

test('CORS preflight and authentication challenges are visible only to allowed MCP browser origins', async () => {
  for (const origin of ['https://chatgpt.com', 'https://chat.openai.com']) {
    const options = await handle(new Request(resource, { method: 'OPTIONS', headers: {
      Origin: origin, 'Access-Control-Request-Headers': 'Authorization, MCP-Protocol-Version',
    } }));
    assert.equal(options.status, 204);
    assert.equal(options.headers.get('Access-Control-Allow-Origin'), origin);
    assert.match(options.headers.get('Access-Control-Allow-Headers') ?? '', /Authorization/);
    const denied = await handle(new Request(resource, { headers: { Origin: origin } }));
    assert.equal(denied.status, 401);
    assert.match(denied.headers.get('Access-Control-Expose-Headers') ?? '', /WWW-Authenticate/);
    const allowed = await handle(rpc('tools/list', await token(), {}, { Origin: origin }));
    assert.equal(allowed.status, 200);
    await allowed.text();
  }
  for (const method of ['OPTIONS', 'POST']) {
    const response = await handle(new Request(resource, { method, headers: { Origin: 'https://evil.example' } }));
    assert.equal(response.status, 403);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
  }
});

test('query-string tokens do not authenticate MCP requests', async () => {
  const response = await handle(new Request(resource + '?access_token=' + await token()));
  assert.equal(response.status, 401);
});

test('symmetric JWT signatures are never accepted', async () => {
  const bearer = await new SignJWT({ sub: config.userId, iss: issuer, aud: resource, exp: Date.now() / 1000 + 300 })
    .setProtectedHeader({ alg: 'HS256' }).sign(new TextEncoder().encode('not-a-server-signing-key'));
  assert.equal((await handle(rpc('tools/list', bearer))).status, 401);
});

test('remote JWKS verification caches public keys, never user authorization', async () => {
  for (const claims of [{}, { client_id: 'another-client' }, {}]) {
    const response = await handle(rpc('tools/list', await token(claims)));
    assert.equal(response.status, claims.client_id ? 403 : 200);
    await response.text();
  }
  assert.deepEqual(vi.mocked(fetch).mock.calls.map(([input]) => String(input)),
    [issuer + '/.well-known/jwks.json']);
});

test('stateless transport handles initialization, notifications, malformed JSON and unsupported streams', async () => {
  const bearer = await token();
  const init = await handle(rpc('initialize', bearer, {
    protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' },
  }));
  assert.equal(init.headers.get('MCP-Session-Id'), null);
  assert.equal((await readRpc(init)).result.serverInfo.name, 'recipier');
  const notification = rpc('notifications/initialized', bearer);
  const body = JSON.parse(await notification.text());
  delete body.id;
  const notified = await handle(new Request(resource, {
    method: 'POST', headers: notification.headers, body: JSON.stringify(body),
  }));
  assert.equal(notified.status, 202);
  const malformed = await handle(new Request(resource, {
    method: 'POST', headers: notification.headers, body: '{',
  }));
  assert.equal(malformed.status, 400);
  for (const method of ['GET', 'DELETE']) {
    const response = await handle(new Request(resource, {
      method, headers: { Authorization: 'Bearer ' + bearer, Accept: 'text/event-stream' },
    }));
    assert.equal(response.status, 405);
  }
});

import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { test } from 'vitest';
import { api, config, id, token } from '../../tests/support/api.ts';
import { apiRoute } from './api.server.ts';

const loader = apiRoute({
  GET: async ({ planning }) => Response.json(await planning.listMealtimes()),
  POST: () => new Response(null, { status: 204 }),
});

test('supported methods and HEAD have explicit private responses', async () => {
  const handler = api(loader);
  const denied = await handler.request({ method: 'PUT' });
  assert.equal(denied.status, 405);
  assert.equal(denied.headers.get('Allow'), 'GET, HEAD, POST');
  assert.equal(handler.calls.length, 0);
  const head = await handler.request({ method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  assert.equal(head.headers.get('Cache-Control'), 'private, no-store');
});

test('cookie-only requests and publishable keys do not authenticate this interim API', async () => {
  const handler = api(loader);
  const response = await handler.request({ auth: null, headers: { Cookie: 'session=pretend', apikey: config.publishableKey } });
  assert.equal(response.status, 401);
  assert.equal(response.headers.get('WWW-Authenticate'), 'Bearer');
  assert.equal(handler.calls.length, 0);
});

test('signed JWTs still require the correct issuer, audience, expiry, role, user, and no OAuth client', async () => {
  const handler = api(loader);
  for (const [claims, status] of [
    [{ iss: 'https://other.supabase.co/auth/v1' }, 401], [{ aud: 'mcp-resource' }, 401],
    [{ aud: 'https://recipes.example/mcp', client_id: id }, 401],
    [{ exp: 1 }, 401], [{ exp: undefined }, 401], [{ role: 'service_role' }, 401],
    [{ nbf: Math.floor(Date.now() / 1000) + 3600 }, 401],
    [{ sub: id }, 403], [{ client_id: id }, 403],
  ] as [Record<string, unknown>, number][]) assert.equal((await handler.request({ auth: token(claims) })).status, status, JSON.stringify(claims));
  assert.equal(handler.calls.length, 0);
});

test('forged signatures and malformed bearer tokens are rejected', async () => {
  const handler = api(loader);
  const otherKeys = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  for (const auth of [token({}, otherKeys.privateKey), 'not-a-jwt']) {
    assert.equal((await handler.request({ auth })).status, 401);
  }
  assert.equal(handler.calls.length, 0);
});

test('concurrent requests retain their own bearer token', async () => {
  const handler = api(loader);
  const tokens = [token({ request: 'one' }), token({ request: 'two' })];
  const responses = await Promise.all(tokens.map(auth => handler.request({ auth })));
  assert.ok(responses.every(response => response.status === 200));
  assert.deepEqual(handler.calls.map(request => request.headers.get('Authorization')).sort(), tokens.map(value => 'Bearer ' + value).sort());
});

test('missing application configuration fails closed', async () => {
  const handler = api(loader, undefined, { ...config, userId: '' });
  assert.equal((await handler.request()).status, 503);
  assert.equal(handler.calls.length, 0);
});

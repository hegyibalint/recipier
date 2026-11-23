import assert from 'node:assert/strict';
import { RouterContextProvider, type LoaderFunctionArgs } from 'react-router';
import { beforeEach, test, vi } from 'vitest';
import { action, loader } from './route.ts';

const settings = vi.hoisted(() => ({ current: {
  supabaseUrl: 'https://discovery-test.supabase.co',
  resourceUrl: 'https://recipes.example/mcp',
} }));
vi.mock('../../lib/config.server.ts', () => ({ mcpConfig: () => settings.current }));
const config = { ...settings.current };
const metadataUrl = 'https://recipes.example/.well-known/oauth-protected-resource/mcp';

beforeEach(() => { settings.current = { ...config }; });

function request(method = 'GET', headers?: HeadersInit): LoaderFunctionArgs {
  const request = new Request(metadataUrl, { method, headers });
  return { request, url: new URL(request.url), pattern: '/.well-known/oauth-protected-resource/mcp',
    params: {}, context: new RouterContextProvider() };
}

test('discovery is public JSON populated only from endpoint configuration', async () => {
  const fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Discovery must not contact any server.'));
  const response = loader(request('GET', {
    Origin: 'https://any-client.example', Authorization: 'Bearer private-token', Cookie: 'session=private',
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    resource: config.resourceUrl,
    authorization_servers: [config.supabaseUrl + '/auth/v1'],
    bearer_methods_supported: ['header'],
    scopes_supported: [],
  });
  assert.equal(response.headers.get('Content-Type'), 'application/json');
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(response.headers.get('WWW-Authenticate'), null);
  assert.equal(fetch.mock.calls.length, 0);
  // No publishable key, allowed user, OAuth client, or signing keys were configured.
});

test('HEAD has JSON response headers but no document body', async () => {
  const response = loader(request('HEAD'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'application/json');
  assert.equal(await response.text(), '');
});

test('preflight is public and does not require valid endpoint configuration', async () => {
  settings.current.resourceUrl = '';
  const response = loader(request('OPTIONS', { Origin: 'https://any-client.example' }));
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(response.headers.get('Access-Control-Allow-Methods'), 'GET, HEAD, OPTIONS');
  assert.equal(await response.text(), '');
});

test('discovery does not accept mutations', async () => {
  const response = action();
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('Allow'), 'GET, HEAD, OPTIONS');
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
});

test('invalid discovery configuration produces a private, generic service error', async () => {
  for (const missing of [{ resourceUrl: '' }, { supabaseUrl: 'http://invalid.example' }]) {
    settings.current = { ...config, ...missing };
    const response = loader(request());
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
    assert.equal(await response.text(), 'MCP discovery is not configured.');
    assert.equal(await loader(request('HEAD')).text(), '');
  }
});

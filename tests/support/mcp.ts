import assert from 'node:assert/strict';
import { exportJWK, generateKeyPair, SignJWT, type JWTPayload } from 'jose';
import { RouterContextProvider } from 'react-router';
import { vi } from 'vitest';

const settings = vi.hoisted(() => ({ current: {
  supabaseUrl: 'https://demo.supabase.co', resourceUrl: 'https://recipes.example/mcp',
  publishableKey: 'sb_publishable_test',
  userId: 'owner', clientId: 'chatgpt',
} }));
vi.mock('../../app/lib/config.server.ts', () => ({ mcpConfig: () => settings.current }));

export const config = { ...settings.current };
export const resource = config.resourceUrl;
export const frontend = new URL(resource).origin;
export const issuer = config.supabaseUrl + '/auth/v1';
const pair = await generateKeyPair('ES256');
const keyset = { keys: [{ ...await exportJWK(pair.publicKey), kid: 'test', alg: 'ES256' }] };

export function mockMcp({ configuration = config, storage }: {
  configuration?: typeof config;
  storage?: typeof fetch;
} = {}) {
  settings.current = configuration;
  // Reload the route so it reads this configuration with a fresh JWKS cache.
  vi.resetModules();
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input);
    if (url.href === issuer + '/.well-known/jwks.json') return Response.json(keyset);
    assert.equal(url.origin, config.supabaseUrl);
    assert.ok(url.pathname.startsWith('/rest/v1/'));
    assert.ok(storage, 'Unexpected Data API request.');
    return storage(input, init);
  });
  return handle;
}

export async function handle(request: Request): Promise<Response> {
  const { loader, action } = await import('../../app/routes/mcp/route.ts');
  const args = {
    request, url: new URL(request.url), pattern: '/mcp', params: {}, context: new RouterContextProvider(),
  };
  return ['GET', 'HEAD', 'OPTIONS'].includes(request.method) ? loader(args) : action(args);
}

export function token(overrides: JWTPayload = {}, key = pair.privateKey) {
  return new SignJWT({
    sub: config.userId, client_id: config.clientId, iss: issuer, aud: resource, role: 'authenticated',
    iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 300,
    ...overrides,
  }).setProtectedHeader({ alg: 'ES256', kid: 'test' }).sign(key);
}

export function rpc(method: string, bearer: string, params: object = {}, headers = {}) {
  return new Request(resource, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + bearer,
      'Content-Type': 'application/json', Accept: 'application/json, text/event-stream',
      ...headers,
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
}

export async function readRpc(response: Response) {
  const body = await response.text();
  if (response.headers.get('Content-Type')?.includes('text/event-stream')) {
    const line = body.split('\n').find(line => line.startsWith('data: '));
    assert.ok(line, 'Missing SSE response.');
    return JSON.parse(line.slice(6));
  }
  return JSON.parse(body);
}

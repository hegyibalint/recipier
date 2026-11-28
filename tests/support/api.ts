import assert from 'node:assert/strict';
import { generateKeyPairSync, randomUUID, sign } from 'node:crypto';
import { RouterContextProvider, type LoaderFunctionArgs } from 'react-router';
import { vi } from 'vitest';
import type { Recipe } from '../../app/lib/recipes/schema.ts';

const settings = vi.hoisted(() => ({ current: {
  supabaseUrl: 'https://api-test.supabase.co',
  publishableKey: 'sb_publishable_test',
  userId: '00000000-0000-4000-8000-000000000001',
} }));
vi.mock('../../app/lib/config.server.ts', () => ({ apiConfig: () => settings.current }));

export const config = { ...settings.current };
export const owner = config.userId;
export const id = '00000000-0000-4000-8000-000000000002';
export const range = { from: '2026-11-09', to: '2026-11-16' };
export const meal = { name: 'Dinner', position: 1 };
export const entry = { date: range.from, mealtime_id: id, recipe_id: id };
export const recipe: Recipe = {
  title: 'Garlic soup', subtitle: 'Garlic three ways', description: 'A garlicky soup.',
  ingredients: [{ id: 'garlic', name: 'fresh Garlic', description: 'Whole bulb' }, { id: 'salt', name: '  salt to taste  ' }],
  components: [
    { id: 'base', steps: [{ text: '${i:garlic:6:cloves} ${i:garlic:20:g} ${i:salt} ${i:garlic}' }] },
    { id: 'finish', depends_on: ['base'], steps: [{ text: '${c:base:2} ${i:garlic:1}' }] },
  ],
};
export const source = (multiplier = 1, document: unknown = recipe) => ({ recipe_id: id, multiplier, recipe: { document } });
export const page = (rows: unknown[], total = rows.length) =>
  Response.json(rows, { headers: { 'Content-Range': `*/${total}` } });

const keys = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const kid = randomUUID();
const publicKey = { ...keys.publicKey.export({ format: 'jwk' }), kid, alg: 'ES256', use: 'sig' };

export function token(overrides: Record<string, unknown> = {}, privateKey = keys.privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: config.supabaseUrl + '/auth/v1', aud: 'authenticated', role: 'authenticated',
    sub: owner, iat: now, exp: now + 3600, ...overrides,
  };
  const body = [JSON.stringify({ alg: 'ES256', kid, typ: 'JWT' }), JSON.stringify(claims)]
    .map(value => Buffer.from(value).toString('base64url')).join('.');
  return body + '.' + sign('sha256', Buffer.from(body), { key: privateKey, dsaEncoding: 'ieee-p1363' }).toString('base64url');
}

type RequestOptions = {
  method?: string; payload?: unknown; body?: BodyInit; auth?: string | null;
  query?: string; params?: Record<string, string>; headers?: HeadersInit;
};
type Handler = (args: LoaderFunctionArgs) => Promise<Response>;

// Exercise actual handlers, JWT verification, and services. Only configuration
// and external HTTP are replaced; these are not local-Supabase E2E tests.
export function api(
  handler: Handler,
  respond: (request: Request, number: number) => Response | Promise<Response> = () => page([]),
  configuration = config,
) {
  settings.current = configuration;
  const calls: Request[] = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    assert.equal(url.origin, config.supabaseUrl);
    if (url.pathname === '/auth/v1/.well-known/jwks.json') return Response.json({ keys: [publicKey] });
    if (url.pathname === '/auth/v1/user') return new Response(null, { status: 401 });
    assert.ok(url.pathname.startsWith('/rest/v1/'));
    assert.equal(request.headers.get('apikey'), config.publishableKey);
    calls.push(request);
    return respond(request, calls.length);
  });
  return {
    calls,
    async request({ method = 'GET', payload, body, auth = token(), query = '', params = {}, headers = {} }: RequestOptions = {}) {
      const requestHeaders = new Headers(headers);
      if (auth) requestHeaders.set('Authorization', 'Bearer ' + auth);
      if (payload !== undefined) requestHeaders.set('Content-Type', 'application/json');
      const request = new Request('https://recipes.example/api/test' + query, {
        method, headers: requestHeaders, body: body ?? (payload === undefined ? undefined : JSON.stringify(payload)),
      });
      return handler({ request, url: new URL(request.url), pattern: '/api/test', params, context: new RouterContextProvider() });
    },
  };
}

export function assertOwner(request: Request, table: string) {
  const url = new URL(request.url);
  assert.equal(url.pathname, '/rest/v1/' + table);
  assert.equal(url.searchParams.get('user_id'), 'eq.' + owner);
  assert.match(request.headers.get('Authorization') ?? '', /^Bearer /);
  return url;
}

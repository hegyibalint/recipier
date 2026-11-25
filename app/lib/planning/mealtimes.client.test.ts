import assert from 'node:assert/strict';
import type { User } from '@supabase/supabase-js';
import { afterEach, beforeEach, test, vi } from 'vitest';
import { allowedUser } from '../auth/session.client';
import { supabase } from '../auth/supabase.client';
import { deleteMealtime, loadMealtimes, reorderMealtimes, saveMealtime } from './mealtimes.client';

vi.mock('../auth/session.client', () => ({
  allowedUser: vi.fn(),
  errorMessage: (error: unknown) => error instanceof Error ? error.message : 'Something went wrong.',
}));
vi.mock('../auth/supabase.client', () => ({ supabase: { auth: { getSession: vi.fn() } } }));

const id = '12345678-1234-4234-8234-123456789abc';
const input = { name: 'Lunch' };
const row = { ...input, id, position: 1, created_at: '2026-11-06T10:00:00Z' };
const fetcher = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(allowedUser).mockResolvedValue({ id: 'owner' } as User);
  vi.mocked(supabase.auth.getSession).mockResolvedValue({
    data: { session: { access_token: 'user-session-token' } }, error: null,
  } as never);
  fetcher.mockReset();
  vi.stubGlobal('fetch', fetcher);
});
afterEach(() => vi.unstubAllGlobals());

function assertLogin(result: unknown) {
  assert.ok(result instanceof Response);
  assert.equal(result.headers.get('Location'), '/auth/login');
}

test('loads the existing API with the current session, including row position', async () => {
  fetcher.mockResolvedValue(Response.json({ mealtimes: [{ ...row, planned_meals_count: 42 }] }));
  assert.deepEqual(await loadMealtimes(), { mealtimes: [{ ...row, ...input, planned_meals_count: 42 }] });
  assert.equal(fetcher.mock.calls[0][0], '/api/mealtimes');
  assert.deepEqual(fetcher.mock.calls[0][1]?.headers, {
    Authorization: 'Bearer user-session-token', 'Content-Type': 'application/json',
  });
  assert.ok(fetcher.mock.calls[0][1]?.signal instanceof AbortSignal);
});

test('empty lists work, but invalid response rows fail the whole load', async () => {
  fetcher.mockResolvedValue(Response.json({ mealtimes: [] }));
  assert.deepEqual(await loadMealtimes(), { mealtimes: [] });
  for (const invalid of [
    {}, { mealtimes: [{ ...row, planned_meals_count: 0 }, { ...row, planned_meals_count: 0, position: 0 }] },
    { mealtimes: [{ ...row, planned_meals_count: 0, id: 'invalid' }] },
    ...[undefined, null, -1, 1.5, '3'].map(planned_meals_count => ({ mealtimes: [{ ...row, planned_meals_count }] })),
  ]) {
    fetcher.mockResolvedValue(Response.json(invalid));
    assert.deepEqual(await loadMealtimes(), { mealtimes: [], error: 'Could not read your saved meal times.' });
  }
});

test('reorder sends the proposed order, preserves auth redirects, and reports stale rows', async () => {
  const ids = [id, '00000000-0000-4000-8000-000000000003'];
  fetcher.mockResolvedValue(new Response(null, { status: 204 }));
  assert.deepEqual(await reorderMealtimes(ids), { message: 'Meal time order updated.' });
  assert.equal(fetcher.mock.calls[0][0], '/api/mealtimes');
  assert.equal(fetcher.mock.calls[0][1]?.method, 'PATCH');
  assert.deepEqual(JSON.parse(fetcher.mock.calls[0][1]?.body as string), { ids });
  assert.deepEqual(await reorderMealtimes([id, id]), { error: 'This meal time order is invalid.' });
  assert.equal(fetcher.mock.calls.length, 1);
  fetcher.mockResolvedValue(new Response(null, { status: 409 }));
  assert.deepEqual(await reorderMealtimes(ids), { error: 'The meal time list changed. Try again with the updated rows.' });
  fetcher.mockResolvedValue(new Response(null, { status: 401 }));
  assertLogin(await reorderMealtimes(ids));
});

test('unused mealtimes retain a genuine zero usage count', async () => {
  fetcher.mockResolvedValue(Response.json({ mealtimes: [{ ...row, planned_meals_count: 0 }] }));
  assert.deepEqual(await loadMealtimes(), { mealtimes: [{ ...row, ...input, planned_meals_count: 0 }] });
});

test('missing user or session redirects without fetching; expired API sessions redirect too', async () => {
  vi.mocked(allowedUser).mockResolvedValue(null);
  assertLogin(await loadMealtimes());
  assertLogin(await saveMealtime(null, input));
  assertLogin(await deleteMealtime(id));
  assert.equal(fetcher.mock.calls.length, 0);
  vi.mocked(allowedUser).mockResolvedValue({ id: 'owner' } as User);
  vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });
  assertLogin(await loadMealtimes());
  assert.equal(fetcher.mock.calls.length, 0);
  vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: { access_token: 'token' } }, error: null } as never);
  fetcher.mockImplementation(async () => new Response(null, { status: 401 }));
  assertLogin(await loadMealtimes());
  assertLogin(await saveMealtime(null, input));
  assertLogin(await deleteMealtime(id));
});

test('creates and updates through POST/PATCH, never accepting ownership fields', async () => {
  fetcher.mockImplementation(async () => Response.json(row));
  assert.deepEqual(await saveMealtime(null, input), { message: 'Meal time added.' });
  assert.deepEqual(await saveMealtime(id, input), { message: 'Meal time updated.' });
  assert.deepEqual(fetcher.mock.calls.map(([url, options]) => [url, options?.method, JSON.parse(options?.body as string)]), [
    ['/api/mealtimes', 'POST', input], [`/api/mealtimes/${id}`, 'PATCH', input],
  ]);
  const calls = fetcher.mock.calls.length;
  for (const invalid of [{ ...input, user_id: 'other' }, { ...input, name: ' ' }, { ...input, ends_at: '10:00' }]) {
    assert.ok((await saveMealtime(null, invalid) as { error: string }).error);
  }
  assert.ok((await saveMealtime('invalid', input) as { error: string }).error);
  assert.ok((await deleteMealtime('invalid') as { error: string }).error);
  assert.equal(fetcher.mock.calls.length, calls);
});

test('delete uses one request and requires 204, with safe errors for unexpected failures', async () => {
  fetcher.mockResolvedValue(new Response(null, { status: 204 }));
  assert.deepEqual(await deleteMealtime(id), { message: 'Meal time deleted.' });
  assert.equal(fetcher.mock.calls[0][0], `/api/mealtimes/${id}`);
  assert.equal(fetcher.mock.calls[0][1]?.method, 'DELETE');
  fetcher.mockResolvedValue(Response.json({ error: { message: 'private details' } }, { status: 409 }));
  assert.deepEqual(await deleteMealtime(id), {
    error: 'Could not delete this meal time. Refresh the list before trying again.',
  });
  fetcher.mockResolvedValue(new Response(null, { status: 200 }));
  assert.ok((await deleteMealtime(id) as { error: string }).error);
});

test('load failures are recoverable and never expose API details', async () => {
  fetcher.mockResolvedValue(Response.json({ error: { message: 'private details' } }, { status: 502 }));
  assert.deepEqual(await loadMealtimes(), { mealtimes: [], error: 'Could not load your meal times. Please try again.' });
  fetcher.mockRejectedValue(new TypeError('Failed to fetch'));
  assert.deepEqual(await loadMealtimes(), { mealtimes: [], error: 'Could not reach your meal times. Please try again.' });
});

test('ambiguous writes are not retried or reported as success', async () => {
  fetcher.mockRejectedValue(new TypeError('Lost response'));
  assert.deepEqual(await saveMealtime(null, input), {
    error: 'Could not confirm the saved meal time. Refresh the list before trying again.',
  });
  assert.equal(fetcher.mock.calls.length, 1);
  assert.deepEqual(await deleteMealtime(id), { error: 'Could not confirm deletion. Refresh the list before trying again.' });
  assert.equal(fetcher.mock.calls.length, 2);
  fetcher.mockResolvedValue(Response.json({}));
  assert.ok((await saveMealtime(null, input) as { error: string }).error);
});

test('missing and forbidden writes do not succeed or expose API details', async () => {
  for (const status of [403, 404, 502]) {
    fetcher.mockImplementation(async () => Response.json({ error: { message: 'private details' } }, { status }));
    for (const result of [await saveMealtime(id, input), await deleteMealtime(id)]) {
      assert.ok(!(result instanceof Response) && result.error);
      assert.doesNotMatch(JSON.stringify(result), /private details/);
    }
  }
});

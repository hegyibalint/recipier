import assert from 'node:assert/strict';
import { beforeEach, test, vi } from 'vitest';
import { planningRequest } from './api.client';
import { addEntry, loadEntries, removeEntry } from './entries.client';

vi.mock('./api.client', () => ({ planningRequest: vi.fn() }));
const id = '12345678-1234-4234-8234-123456789abc';
const input = { date: '2026-11-06', mealtime_id: id, recipe_id: id };
const row = { ...input, id, multiplier: 1, created_at: '2026-11-06T10:00:00Z' };
const range = { from: '2026-11-02', to: '2026-11-09' };
beforeEach(() => { vi.mocked(planningRequest).mockReset(); });

test('loads exactly the requested half-open range and validates stored entries', async () => {
  vi.mocked(planningRequest).mockResolvedValue(Response.json({ entries: [row] }));
  assert.deepEqual(await loadEntries(range), { entries: [row] });
  assert.deepEqual(vi.mocked(planningRequest).mock.calls, [['meal-plan?from=2026-11-02&to=2026-11-09']]);
  for (const invalid of [{ ...row, date: range.to }, { ...row, date: '2026-11-01' }, { ...row, multiplier: 0 }, { ...row, id: 'bad' }]) {
    vi.mocked(planningRequest).mockResolvedValue(Response.json({ entries: [row, invalid] }));
    assert.ok((await loadEntries(range) as { error: string }).error);
  }
});

test('invalid ranges and invalid assignment inputs do not make requests', async () => {
  assert.ok((await loadEntries({ from: range.to, to: range.from }) as { error: string }).error);
  for (const invalid of [{ ...input, user_id: id }, { ...input, recipe_id: null }, { ...input, date: 'tomorrow' }]) {
    assert.ok((await addEntry(invalid) as { error: string }).error);
  }
  assert.ok((await removeEntry('bad') as { error: string }).error);
  assert.equal(vi.mocked(planningRequest).mock.calls.length, 0);
});

test('assignments default to one batch and require a confirmed 201 response', async () => {
  vi.mocked(planningRequest).mockResolvedValue(Response.json(row, { status: 201 }));
  assert.deepEqual(await addEntry(input), {});
  assert.deepEqual(vi.mocked(planningRequest).mock.calls, [['meal-plan', {
    method: 'POST', body: JSON.stringify({ ...input, multiplier: 1 }),
  }]]);
  vi.mocked(planningRequest).mockResolvedValue(Response.json(row));
  assert.ok((await addEntry(input) as { error: string }).error);
  vi.mocked(planningRequest).mockResolvedValue(Response.json({}, { status: 201 }));
  assert.ok((await addEntry(input) as { error: string }).error);
});

test('removal targets an entry, not a recipe, and requires 204', async () => {
  vi.mocked(planningRequest).mockResolvedValue(new Response(null, { status: 204 }));
  assert.deepEqual(await removeEntry(id), {});
  assert.deepEqual(vi.mocked(planningRequest).mock.calls, [[`meal-plan/${id}`, { method: 'DELETE' }]]);
  vi.mocked(planningRequest).mockResolvedValue(new Response(null, { status: 200 }));
  assert.ok((await removeEntry(id) as { error: string }).error);
});

test('auth redirects are preserved by reads and writes', async () => {
  const login = new Response(null, { status: 302, headers: { Location: '/auth/login' } });
  vi.mocked(planningRequest).mockResolvedValue(login);
  assert.equal(await loadEntries(range), login);
  assert.equal(await addEntry(input), login);
  assert.equal(await removeEntry(id), login);
});

test('failures never leak API details and ambiguous writes are not retried', async () => {
  for (const status of [403, 404, 409, 502]) {
    vi.mocked(planningRequest).mockImplementation(async () => Response.json({ error: 'private details' }, { status }));
    for (const result of [await loadEntries(range), await addEntry(input), await removeEntry(id)]) {
      assert.ok(!(result instanceof Response) && result.error);
      assert.doesNotMatch(JSON.stringify(result), /private details/);
    }
  }
  vi.mocked(planningRequest).mockReset();
  vi.mocked(planningRequest).mockRejectedValue(new TypeError('Lost response'));
  assert.match((await addEntry(input) as { error: string }).error, /Check the slot before adding it again/);
  assert.equal(vi.mocked(planningRequest).mock.calls.length, 1);
});

import assert from 'node:assert/strict';
import type { User } from '@supabase/supabase-js';
import { beforeEach, test, vi } from 'vitest';
import { allowedUser } from '../auth/session.client';
import { supabase } from '../auth/supabase.client';
import { loadRecipeChoices } from './choices.client';

vi.mock('../auth/session.client', () => ({
  allowedUser: vi.fn(), errorMessage: (error: unknown) => error instanceof Error ? error.message : 'Failed.',
}));
vi.mock('../auth/supabase.client', () => ({ supabase: { from: vi.fn() } }));
const choice = (index: number) => ({
  id: `00000000-0000-4000-8000-${index.toString(16).padStart(12, '0')}`, title: `Recipe ${index}`, subtitle: 'A simple meal',
});
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(allowedUser).mockResolvedValue({ id: 'owner' } as User);
});

function database(pages: { data: unknown; count: number | null; error?: object }[]) {
  const calls: unknown[][] = [];
  const query = {
    select(...args: unknown[]) { calls.push(['select', ...args]); return this; },
    eq(...args: unknown[]) { calls.push(['eq', ...args]); return this; },
    order(...args: unknown[]) { calls.push(['order', ...args]); return this; },
    async range(...args: unknown[]) { calls.push(['range', ...args]); return pages.shift(); },
  };
  vi.mocked(supabase.from).mockReturnValue(query as never);
  return calls;
}

test('picker loads all lightweight recipe summaries with owner filters, not just the latest 50', async () => {
  const recipes = Array.from({ length: 501 }, (_, index) => choice(index));
  const calls = database([{ data: recipes.slice(0, 500), count: 501 }, { data: recipes.slice(500), count: 501 }]);
  assert.deepEqual(await loadRecipeChoices(), { recipes });
  assert.deepEqual(calls.filter(call => call[0] === 'range'), [['range', 0, 499], ['range', 500, 999]]);
  assert.deepEqual(calls.filter(call => call[0] === 'eq'), [['eq', 'user_id', 'owner'], ['eq', 'user_id', 'owner']]);
  assert.deepEqual(calls[0], ['select', 'id,title:document->>title,subtitle:document->>subtitle', { count: 'exact' }]);
  assert.deepEqual(calls.slice(2, 4), [['order', 'created_at', { ascending: false }], ['order', 'id', { ascending: false }]]);
});

test('signed-out users redirect without querying; empty collections are valid', async () => {
  database([]);
  vi.mocked(allowedUser).mockResolvedValue(null);
  const result = await loadRecipeChoices();
  assert.ok(result instanceof Response);
  assert.equal(result.headers.get('Location'), '/auth/login');
  assert.equal(vi.mocked(supabase.from).mock.calls.length, 0);
  vi.mocked(allowedUser).mockResolvedValue({ id: 'owner' } as User);
  database([{ data: [], count: 0 }]);
  assert.deepEqual(await loadRecipeChoices(), { recipes: [] });
});

test('invalid or incomplete pages fail the entire list, not a partial picker', async () => {
  for (const page of [
    { data: [{ ...choice(1), title: ' ' }], count: 1 },
    { data: [choice(1)], count: null }, { data: [choice(1)], count: 0 },
    { data: null, count: 0 }, { data: [], count: 1 },
  ]) {
    database([page]);
    const result = await loadRecipeChoices();
    assert.ok(!(result instanceof Response) && result.error);
    assert.deepEqual(result.recipes, []);
  }
  database([{ data: [choice(1)], count: 2 }, { data: [], count: 2 }]);
  assert.deepEqual(await loadRecipeChoices(), { recipes: [], error: 'Could not load the complete recipe list. Please try again.' });
});

test('storage errors are recoverable without exposing private details', async () => {
  database([{ data: null, count: null, error: { message: 'private details' } }]);
  assert.deepEqual(await loadRecipeChoices(), { recipes: [], error: 'Could not load your recipes. Please try again.' });
});

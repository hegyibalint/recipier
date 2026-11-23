import assert from 'node:assert/strict';
import type { User } from '@supabase/supabase-js';
import { test, vi } from 'vitest';
import { document, id, row } from '../../../tests/support/recipes.ts';
import { allowedUser } from '../auth/session.client.ts';
import { supabase } from '../auth/supabase.client.ts';
import { loadRecipe, deleteRecipe, renameRecipe } from './store.client.ts';

vi.mock('../auth/session.client.ts', () => ({
  allowedUser: vi.fn(),
  errorMessage: (error: unknown) => error instanceof Error ? error.message : 'Something went wrong.',
}));
vi.mock('../auth/supabase.client.ts', () => ({ supabase: { from: vi.fn(), rpc: vi.fn() } }));

function response(result: unknown): Response {
  assert.ok(result instanceof Response);
  return result;
}

type Options = {
  user?: { id: string } | null; data?: unknown;
  error?: { message: string } | null; authError?: Error;
};
function loader({ user = { id: 'owner' }, data = row, error = null, authError }: Options = {}) {
  const calls: unknown[][] = [];
  const query = {
    delete() { calls.push(['delete']); return this; },
    select(...args: unknown[]) { calls.push(['select', ...args]); return this; },
    eq(...args: unknown[]) { calls.push(['eq', ...args]); return this; },
    async maybeSingle() { return { data, error }; },
  };
  vi.mocked(allowedUser).mockImplementation(async () => {
    if (authError) throw authError;
    return user as User | null;
  });
  vi.mocked(supabase.from).mockImplementation(table => {
    calls.push(['from', table]);
    return query as unknown as ReturnType<typeof supabase.from>;
  });
  return { loadRecipe, deleteRecipe, calls };
}

test('renaming validates input and calls the atomic title-only RPC', async () => {
  loader();
  vi.mocked(supabase.rpc).mockResolvedValue({ data: true, error: null } as never);
  assert.deepEqual(await renameRecipe(id, '  New title  '), { savedTitle: 'New title' });
  assert.deepEqual(vi.mocked(supabase.rpc).mock.calls, [['rename_recipe', { recipe_id: id, new_title: 'New title' }]]);
  vi.mocked(supabase.rpc).mockClear();
  for (const value of ['', '   ', null, 42]) {
    assert.deepEqual(await renameRecipe(id, value), { error: 'Enter a recipe title.' });
  }
  assert.deepEqual(await renameRecipe('invalid', 'Title'), { error: 'This recipe isn’t available.' });
  assert.equal(vi.mocked(supabase.rpc).mock.calls.length, 0);
});

test('renaming requires a session and reports missing rows and failures safely', async () => {
  loader({ user: null });
  assert.equal(response(await renameRecipe(id, 'Title')).headers.get('Location'), '/auth/login');
  assert.equal(vi.mocked(supabase.rpc).mock.calls.length, 0);
  loader();
  vi.mocked(supabase.rpc).mockResolvedValue({ data: false, error: null } as never);
  assert.deepEqual(await renameRecipe(id, 'Title'), { error: 'This recipe isn’t available.' });
  vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'private details' } } as never);
  assert.deepEqual(await renameRecipe(id, 'Title'), { error: 'Could not save the title. Please try again.' });
});

test('detail fetches the requested recipe with an owner filter, not the newest-50 list', async () => {
  const { loadRecipe, calls } = loader();
  assert.deepEqual(await loadRecipe(id), { recipe: row });
  assert.deepEqual(calls, [
    ['from', 'recipes'], ['select', 'id, created_at, document'], ['eq', 'user_id', 'owner'], ['eq', 'id', id],
  ]);
});

test('saved recipes require nonblank title, subtitle, and description', async () => {
  for (const field of ['title', 'subtitle', 'description']) {
    for (const value of [undefined, '', '   ', null, 42]) {
      const invalidRow = { ...row, document: { ...document, [field]: value } };
      assert.deepEqual(await loader({ data: invalidRow }).loadRecipe(id), {
        recipe: null, error: 'A saved recipe has an unsupported format.',
      });
    }
  }
});

test('signed-out users are redirected without querying recipes', async () => {
  const { loadRecipe, calls } = loader({ user: null });
  const result = await loadRecipe(id);
  assert.equal(response(result).status, 302);
  assert.equal(response(result).headers.get('Location'), '/auth/login');
  assert.deepEqual(calls, []);
});

test('invalid IDs are not queried; missing and inaccessible rows use the same state', async () => {
  const { loadRecipe, calls } = loader({ data: null });
  assert.deepEqual(await loadRecipe('not-a-uuid'), { recipe: null, notFound: true });
  assert.deepEqual(calls, []);
  assert.deepEqual(await loadRecipe(id), { recipe: null, notFound: true });
});

test('database errors offer a retry without exposing database details', async () => {
  const { loadRecipe } = loader({ error: { message: 'private database details' } });
  assert.deepEqual(await loadRecipe(id), { recipe: null, error: 'Could not load this recipe. Please try again.' });
});

test('invalid saved documents and session failures become recoverable errors', async () => {
  assert.deepEqual(await loader({ data: { ...row, document: {} } }).loadRecipe(id), {
    recipe: null, error: 'A saved recipe has an unsupported format.',
  });
  const { loadRecipe, calls } = loader({ authError: new Error('Could not verify your session.') });
  assert.deepEqual(await loadRecipe(id), { recipe: null, error: 'Could not verify your session.' });
  assert.deepEqual(calls, []);
});

test('deletion targets only the requested owner recipe and redirects on confirmed success', async () => {
  const { deleteRecipe, calls } = loader({ data: { id } });
  const result = await deleteRecipe(id);
  assert.equal(response(result).status, 302);
  assert.equal(response(result).headers.get('Location'), '/');
  assert.deepEqual(calls, [
    ['from', 'recipes'], ['delete'], ['eq', 'user_id', 'owner'], ['eq', 'id', id], ['select', 'id'],
  ]);
});

test('deletion requires a session and a valid recipe ID before querying', async () => {
  const signedOut = loader({ user: null });
  assert.equal(response(await signedOut.deleteRecipe(id)).headers.get('Location'), '/auth/login');
  assert.deepEqual(signedOut.calls, []);
  const invalid = loader();
  assert.deepEqual(await invalid.deleteRecipe('invalid'), { error: 'This recipe isn’t available.' });
  assert.deepEqual(invalid.calls, []);
  const failedSession = loader({ authError: new Error('Could not verify your session.') });
  assert.deepEqual(await failedSession.deleteRecipe(id), { error: 'Could not verify your session.' });
  assert.deepEqual(failedSession.calls, []);
});

test('deletion failures and inaccessible rows do not report success or expose database details', async () => {
  assert.deepEqual(await loader({ error: { message: 'private database details' } }).deleteRecipe(id), {
    error: 'Could not delete this recipe. Please try again.',
  });
  assert.deepEqual(await loader({ data: null }).deleteRecipe(id), {
    error: 'This recipe isn’t available. It may already have been deleted.',
  });
});

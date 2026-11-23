import assert from 'node:assert/strict';
import { beforeEach, test, vi } from 'vitest';
import { loadRecipeChoices } from '../recipes/choices.client';
import { loadEntries } from './entries.client';
import { loadMealtimes } from './mealtimes.client';
import { loadPlanning } from './overview.client';

vi.mock('../recipes/choices.client', () => ({ loadRecipeChoices: vi.fn() }));
vi.mock('./entries.client', () => ({ loadEntries: vi.fn() }));
vi.mock('./mealtimes.client', () => ({ loadMealtimes: vi.fn() }));
const range = { from: '2026-11-02', to: '2026-11-09' };
beforeEach(() => {
  vi.mocked(loadMealtimes).mockResolvedValue({ mealtimes: [] });
  vi.mocked(loadEntries).mockResolvedValue({ entries: [] });
  vi.mocked(loadRecipeChoices).mockResolvedValue({ recipes: [] });
});

test('planning combines meal times, entries, and lightweight recipe choices', async () => {
  assert.deepEqual(await loadPlanning(range), { mealtimes: [], entries: [], recipes: [], error: undefined });
  assert.deepEqual(vi.mocked(loadEntries).mock.calls, [[range]]);
});

test('any failed source marks the overview as failed instead of implying an empty plan', async () => {
  vi.mocked(loadEntries).mockResolvedValue({ entries: [], error: 'Entries failed.' });
  assert.equal((await loadPlanning(range) as { error: string }).error, 'Entries failed.');
  vi.mocked(loadEntries).mockResolvedValue({ entries: [] });
  vi.mocked(loadRecipeChoices).mockResolvedValue({ recipes: [], error: 'Recipes failed.' });
  assert.equal((await loadPlanning(range) as { error: string }).error, 'Recipes failed.');
});

test('authentication redirects from any source are not swallowed', async () => {
  const login = new Response(null, { status: 302, headers: { Location: '/auth/login' } });
  vi.mocked(loadMealtimes).mockResolvedValue(login);
  assert.equal(await loadPlanning(range), login);
  vi.mocked(loadMealtimes).mockResolvedValue({ mealtimes: [] });
  vi.mocked(loadEntries).mockResolvedValue(login);
  assert.equal(await loadPlanning(range), login);
  vi.mocked(loadEntries).mockResolvedValue({ entries: [] });
  vi.mocked(loadRecipeChoices).mockResolvedValue(login);
  assert.equal(await loadPlanning(range), login);
});

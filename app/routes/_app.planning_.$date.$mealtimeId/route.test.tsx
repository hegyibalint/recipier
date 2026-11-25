import assert from 'node:assert/strict';
import { createElement } from 'react';
import { test, vi } from 'vitest';
import { navigation, renderWithRouter } from '../../../tests/support/router';
import { addEntry, loadEntries, removeEntry } from '../../lib/planning/entries.client';
import { loadPlanning } from '../../lib/planning/overview.client';
import MealSlot, { clientAction, clientLoader, HydrateFallback } from './route';
import type { Route } from './+types/route';

vi.mock('../../lib/planning/overview.client', () => ({ loadPlanning: vi.fn() }));
vi.mock('../../lib/planning/entries.client', () => ({ addEntry: vi.fn(), removeEntry: vi.fn(), loadEntries: vi.fn() }));
const mealId = '00000000-0000-4000-8000-000000000001';
const recipeId = '00000000-0000-4000-8000-000000000002';
const entryId = '00000000-0000-4000-8000-000000000003';
const params = { date: '2026-11-06', mealtimeId: mealId };
const meal = { id: mealId, name: 'Lunch', position: 1, created_at: '', planned_meals_count: 1 };
const recipe = { id: recipeId, title: 'Garlic soup', subtitle: 'A comforting bowl' };
const entry = { id: entryId, date: params.date, mealtime_id: mealId, recipe_id: recipeId, multiplier: 1, created_at: '' };
const data = { date: params.date, meal, entries: [], recipes: [recipe], error: undefined, notFound: false };
function render(loaderData: unknown = data, actionData?: unknown) {
  return renderWithRouter(createElement(MealSlot, { loaderData, actionData } as Route.ComponentProps), `/planning/${params.date}/${mealId}`);
}
function load(routeParams: unknown = params) {
  return clientLoader({ params: routeParams } as Route.ClientLoaderArgs);
}
function action(form: Record<string, string>, method = 'POST', routeParams: unknown = params) {
  return clientAction({ params: routeParams, request: new Request('http://localhost/planning/slot', {
    method, body: new URLSearchParams(form),
  }) } as Route.ClientActionArgs);
}

test('slot loader validates deep links and loads only the selected date and meal', async () => {
  vi.mocked(loadPlanning).mockResolvedValue({
    mealtimes: [meal], entries: [entry, { ...entry, mealtime_id: 'other' }], recipes: [recipe], error: undefined,
  });
  assert.deepEqual(await load(), { ...data, entries: [entry] });
  assert.deepEqual(vi.mocked(loadPlanning).mock.calls, [[{ from: '2026-11-06', to: '2026-11-07' }]]);
  vi.mocked(loadPlanning).mockClear();
  for (const invalid of [{ ...params, date: '2026-02-29' }, { ...params, mealtimeId: 'invalid' }]) {
    const result = await load(invalid);
    assert.ok(!(result instanceof Response) && result.notFound);
  }
  assert.equal(vi.mocked(loadPlanning).mock.calls.length, 0);
});

test('missing meals, API failures, and authentication redirects remain distinct', async () => {
  vi.mocked(loadPlanning).mockResolvedValue({ mealtimes: [], entries: [], recipes: [], error: undefined });
  const missing = await load();
  assert.ok(!(missing instanceof Response) && missing.notFound);
  vi.mocked(loadPlanning).mockResolvedValue({ mealtimes: [], entries: [], recipes: [], error: 'Try again.' });
  const failed = await load();
  assert.ok(!(failed instanceof Response) && failed.error && !failed.notFound);
  const login = new Response(null, { status: 302, headers: { Location: '/auth/login' } });
  vi.mocked(loadPlanning).mockResolvedValue(login);
  assert.equal(await load(), login);
});

test('add uses URL slot coordinates and stays on the slot page for successive assignments', async () => {
  vi.mocked(addEntry).mockResolvedValue({});
  assert.deepEqual(await action({ intent: 'add', recipe_id: recipeId, date: '2027-01-01', mealtime_id: 'other', user_id: 'other', multiplier: '100' }), {});
  const secondRecipe = '00000000-0000-4000-8000-000000000004';
  assert.deepEqual(await action({ intent: 'add', recipe_id: secondRecipe }), {});
  assert.deepEqual(vi.mocked(addEntry).mock.calls, [
    [{ date: params.date, mealtime_id: mealId, recipe_id: recipeId }],
    [{ date: params.date, mealtime_id: mealId, recipe_id: secondRecipe }],
  ]);
});

test('invalid methods, intents, and slot parameters cannot mutate', async () => {
  for (const result of [
    await action({ intent: 'add', recipe_id: recipeId }, 'PUT'),
    await action({ intent: 'unknown' }),
    await action({ intent: 'add', recipe_id: recipeId }, 'POST', { ...params, mealtimeId: 'bad' }),
    await action({ intent: 'remove', entry_id: 'bad' }),
  ]) assert.ok(!(result instanceof Response) && result.error);
  assert.equal(vi.mocked(addEntry).mock.calls.length, 0);
  assert.equal(vi.mocked(removeEntry).mock.calls.length, 0);
});

test('removal verifies that the entry belongs to this slot before deleting only the assignment', async () => {
  vi.mocked(loadEntries).mockResolvedValue({ entries: [entry] });
  vi.mocked(removeEntry).mockResolvedValue({});
  assert.deepEqual(await action({ intent: 'remove', entry_id: entryId }), {});
  assert.deepEqual(vi.mocked(removeEntry).mock.calls, [[entryId]]);
  vi.mocked(removeEntry).mockClear();
  for (const entries of [[], [{ ...entry, mealtime_id: 'other' }]]) {
    vi.mocked(loadEntries).mockResolvedValue({ entries });
    assert.ok((await action({ intent: 'remove', entry_id: entryId }) as { error: string }).error);
  }
  assert.equal(vi.mocked(removeEntry).mock.calls.length, 0);
});

test('failed writes stay on the page with an error rather than reporting success', async () => {
  vi.mocked(addEntry).mockResolvedValue({ error: 'Could not confirm assignment.' });
  assert.deepEqual(await action({ intent: 'add', recipe_id: recipeId }), { error: 'Could not confirm assignment.' });
  vi.mocked(loadEntries).mockResolvedValue({ entries: [], error: 'Could not load.' });
  assert.deepEqual(await action({ intent: 'remove', entry_id: entryId }), { error: 'Could not load.' });
  const login = new Response(null, { status: 302, headers: { Location: '/auth/login' } });
  vi.mocked(addEntry).mockResolvedValue(login);
  assert.equal(await action({ intent: 'add', recipe_id: recipeId }), login);
});

test('a standalone page gives date/time context, search, recipe previews, and explicit add actions without a dialog', () => {
  const html = render();
  assert.match(html, /href="\/planning\?week=2026-11-02&amp;day=2026-11-06"/);
  assert.match(html, /<h1[^>]*>Lunch<\/h1>/);
  assert.match(html, /dateTime="2026-11-06"/);
  assert.doesNotMatch(html, /12:00–13:00/);
  assert.match(html, /type="search"/);
  assert.match(html, /href="\/recipes\/00000000-0000-4000-8000-000000000002"/);
  assert.match(html, /A comforting bowl/);
  assert.match(html, /aria-label="Add Garlic soup to Lunch"/);
  assert.doesNotMatch(html, /<dialog|aria-modal|type="time"/);
});

test('recipe search uses an icon inside the field rather than a visible text label', () => {
  const html = render();
  assert.match(html, /<label class="search"><svg[^>]*aria-hidden="true"/);
  assert.match(html, /<input(?=[^>]*type="search")(?=[^>]*aria-label="Search recipes")[^>]*>/);
  assert.doesNotMatch(html, />Search recipes</);
});

test('updated assignments stay alongside the picker without a success blurb', () => {
  const html = render({ ...data, entries: [entry] }, {});
  assert.doesNotMatch(html, /role="status"|Recipe added\.|Recipe removed\./);
  assert.match(html, /In this slot/);
  assert.match(html, /aria-label="Remove Garlic soup from this slot"/);
  assert.match(html, /type="search"/);
  assert.match(html, /aria-label="Add Garlic soup to Lunch"/);
  assert.match(html, /href="\/planning\?week=2026-11-02&amp;day=2026-11-06"/);
});

test('existing assignments are visible and removable; pending submissions disable writes', () => {
  const html = render({ ...data, entries: [{ ...entry, multiplier: 0.5 }] });
  assert.match(html, /In this slot/);
  assert.match(html, /×0.5/);
  assert.match(html, /aria-label="Remove Garlic soup from this slot"/);
  navigation.state = 'submitting';
  navigation.formData = new FormData();
  navigation.formData.set('recipe_id', recipeId);
  const busy = render({ ...data, entries: [entry] });
  assert.match(busy, /aria-busy="true"/);
  assert.equal((busy.match(/disabled=""/g) ?? []).length, 2);
  assert.match(busy, /Adding…/);
});

test('empty, missing, recoverable error, and hydration states are clear', () => {
  assert.match(render({ ...data, recipes: [] }), /No recipes yet/);
  assert.match(render({ ...data, meal: null, notFound: true }), /This meal slot isn’t available/);
  const error = render({ ...data, error: 'Could not load.' });
  assert.match(error, /role="alert">Could not load/);
  assert.match(error, /Try again/);
  assert.doesNotMatch(error, /<form/);
  assert.match(render(data, { error: 'Could not save.' }), /role="alert">Could not save/);
  assert.match(renderWithRouter(createElement(HydrateFallback)), /role="status">Loading your meal slot/);
});

test('recipe text stays plain text', () => {
  const html = render({ ...data, recipes: [{ ...recipe, title: '<script>bad()</script>', subtitle: '<img src=x>' }] });
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&lt;img/);
  assert.doesNotMatch(html, /<script|<img/);
});

import assert from 'node:assert/strict';
import { createElement } from 'react';
import { afterEach, test, vi } from 'vitest';
import { navigation, renderWithRouter } from '../../../tests/support/router';
import { planningRequest } from '../../lib/planning/api.client';
import ShoppingList, { clientLoader } from './route';
import type { Route } from './+types/route';

vi.mock('../../lib/planning/api.client', () => ({ planningRequest: vi.fn() }));

function load(query = '') {
  return clientLoader({ request: new Request('http://localhost/shopping-list' + query) } as Route.ClientLoaderArgs);
}

function render(loaderData: unknown) {
  return renderWithRouter(createElement(ShoppingList, { loaderData } as Route.ComponentProps), '/shopping-list');
}

afterEach(() => vi.useRealTimers());

test('defaults to the current local planning week', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 11, 12));
  vi.mocked(planningRequest).mockResolvedValueOnce(Response.json({ items: [] }));
  const data = await load();
  assert.deepEqual(data, { dates: { from: '2026-11-09', through: '2026-11-15' }, totals: [] });
  assert.deepEqual(vi.mocked(planningRequest).mock.calls[0], [
    'shopping-list', { method: 'POST', body: JSON.stringify({ from: '2026-11-09', to: '2026-11-16' }) },
  ]);
  assert.match(render(data), /No ingredients found for these dates/);
});

test('shows collapsed ingredient totals and per-recipe contributions without converting units', async () => {
  const soup = { id: '00000000-0000-4000-8000-000000000001', title: 'Cabbage soup' };
  const salad = { id: '00000000-0000-4000-8000-000000000002', title: 'Cabbage salad' };
  vi.mocked(planningRequest).mockResolvedValueOnce(Response.json({ items: [
    { id: 'cabbage', name: 'cabbage', amount: 1, unit: 'heads', source: soup },
    { id: 'cabbage', name: 'cabbage', amount: 250, unit: 'g', source: salad },
    { id: 'cabbage', name: 'cabbage', amount: 1, unit: 'heads', source: soup },
    { id: 'salt', name: 'salt', amount: null, unit: null, source: soup },
    { id: 'tofu', name: 'Tofu', description: 'Soft tofu', original_name: '嫩豆腐', amount: 300, unit: 'g', source: soup },
    { id: 'tofu', name: 'Tofu', description: 'Hard tofu', amount: 400, unit: 'g', source: salad },
  ] }));
  const data = await load('?from=2026-12-31&through=2026-12-31');
  assert.deepEqual(vi.mocked(planningRequest).mock.calls[0], [
    'shopping-list', { method: 'POST', body: JSON.stringify({ from: '2026-12-31', to: '2027-01-01' }) },
  ]);

  const html = render(data);
  const disclosures = html.match(/<details[^>]*>.*?<\/details>/g) ?? [];
  assert.equal(disclosures.length, 4);
  assert.doesNotMatch(html, /<details[^>]*\sopen(?:=|>)/);
  const [cabbage, salt, hard, soft] = disclosures;
  assert.match(cabbage, /<summary>.*<strong>Cabbage<\/strong>.*2 heads \+ 250 g.*<\/summary>/);
  assert.match(cabbage, /Cabbage soup<\/a><span[^>]*><span>2 heads<\/span>/);
  assert.match(cabbage, /Cabbage salad<\/a><span[^>]*><span>250 g<\/span>/);
  assert.equal((cabbage.match(/Cabbage soup/g) ?? []).length, 1);
  assert.match(salt, /Cabbage soup<\/a>.*No quantity specified/);
  assert.match(hard, /<summary>.*Hard tofu.*400 g.*<\/summary>/);
  assert.match(soft, /<summary>.*<strong>Tofu<\/strong> \(嫩豆腐\).*Soft tofu.*300 g.*<\/summary>/);
  assert.doesNotMatch(html, /700 g/);
  assert.match(html, /name="through"[^>]*value="2026-12-31"/);

  navigation.state = 'loading';
  assert.match(render(data), /role="status">Loading your shopping list/);
  assert.doesNotMatch(render(data), /2 heads/);
});

test('invalid dates do not fetch a list', async () => {
  const data = await load('?from=2026-11-07&through=2026-11-06');
  assert.equal(vi.mocked(planningRequest).mock.calls.length, 0);
  assert.match(render(data), /role="alert">Choose valid dates/);
});

test('preserves login redirects and does not display a failed load as empty', async () => {
  const login = new Response(null, { status: 302, headers: { Location: '/auth/login' } });
  vi.mocked(planningRequest).mockResolvedValueOnce(login);
  assert.equal(await load(), login);

  for (const response of [new Response('unavailable', { status: 502 }), Response.json({ wrong: [] })]) {
    vi.mocked(planningRequest).mockResolvedValueOnce(response);
    const html = render(await load());
    assert.match(html, /role="alert">Could not load your shopping list/);
    assert.match(html, /Try again/);
    assert.doesNotMatch(html, /No ingredients found/);
  }
});

import assert from 'node:assert/strict';
import { createElement } from 'react';
import { afterEach, beforeEach, test, vi } from 'vitest';
import { navigation, renderWithRouter } from '../../../tests/support/router';
import { planningRequest } from '../../lib/planning/api.client';
import ShoppingList, { clientAction, clientLoader } from './route';
import { ExtraIngredientEditor } from './extra-ingredient-editor';
import type { Route } from './+types/route';

vi.mock('../../lib/planning/api.client', () => ({ planningRequest: vi.fn() }));

function load(query = '') {
  return clientLoader({ request: new Request('http://localhost/shopping-list' + query) } as Route.ClientLoaderArgs);
}

function render(loaderData: unknown, actionData?: unknown) {
  return renderWithRouter(createElement(ShoppingList, { loaderData, actionData } as Route.ComponentProps), '/shopping-list');
}

const plannedRequests = () => vi.mocked(planningRequest).mock.calls.filter(([path]) => path === 'shopping-list');

beforeEach(() => {
  vi.mocked(planningRequest).mockReset().mockImplementation(async path => {
    if (path === 'shopping-list-extras') return Response.json({ items: [] });
    throw new Error('Unexpected request');
  });
});

afterEach(() => vi.useRealTimers());

test('defaults to seven days including today on the local calendar', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 11, 12));
  vi.mocked(planningRequest).mockResolvedValueOnce(Response.json({ items: [] }));
  const data = await load();
  assert.deepEqual(data, { selection: { mode: 'days', days: 7 }, range: { from: '2026-11-11', to: '2026-11-18' }, totals: [], extras: [] });
  assert.deepEqual(vi.mocked(planningRequest).mock.calls[0], [
    'shopping-list', { method: 'POST', body: JSON.stringify({ from: '2026-11-11', to: '2026-11-18' }) },
  ]);
  const html = render(data);
  assert.match(html, /No ingredients found for these dates/);
  assert.match(html, /<a aria-current="true" href="\/shopping-list\?mode=days&amp;days=7"[^>]*>Days ahead/);
  assert.match(html, /<\/nav><div role="group" aria-label="Days to shop for" class="stepper dayCount">.*>7 days<\/div>/);
  assert.match(html, /aria-label="Shop for one fewer day" href="\/shopping-list\?mode=days&amp;days=6"/);
  assert.match(html, /aria-label="Shop for one more day" href="\/shopping-list\?mode=days&amp;days=8"/);
});

test('offers a chosen number of days, next Monday–Sunday, and all upcoming recipes', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 11, 30, 12));
  const cases = [
    ['?mode=days&days=1', { from: '2026-12-30', to: '2026-12-31' }],
    ['?mode=days&days=3', { from: '2026-12-30', to: '2027-01-02' }],
    ['?mode=next-week&days=3', { from: '2027-01-04', to: '2027-01-11' }],
    ['?mode=all', { from: '2026-12-30' }],
  ] as const;
  for (const [query, range] of cases) {
    vi.mocked(planningRequest).mockResolvedValueOnce(Response.json({ items: [] }));
    const html = render(await load(query));
    assert.deepEqual(plannedRequests().at(-1), [
      'shopping-list', { method: 'POST', body: JSON.stringify(range) },
    ]);
    assert.match(html, /href="\/shopping-list\?mode=next-week&amp;days=\d+"[^>]*>Next week/);
    assert.match(html, /href="\/shopping-list\?mode=all&amp;days=\d+"[^>]*>All upcoming/);
    assert.doesNotMatch(html, /<select|Show list/);
    if (query.startsWith('?mode=next-week')) {
      assert.match(html, /href="\/shopping-list\?mode=days&amp;days=3"[^>]*>Days ahead/);
      assert.match(html, /aria-current="true" href="\/shopping-list\?mode=next-week&amp;days=3"/);
      assert.doesNotMatch(html, /Days to shop for/);
    }
    if (query === '?mode=all') {
      assert.match(html, /All planned recipes from .* onward/);
      assert.doesNotMatch(html, /Days to shop for/);
    }
  }
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
  assert.doesNotMatch(html, /name="through"/);
  assert.doesNotMatch(html, /aria-current="true"/);

  navigation.state = 'loading';
  assert.match(render(data), /role="status">Loading your shopping list/);
  assert.doesNotMatch(render(data), /2 heads/);
});

test('invalid dates do not fetch planned ingredients', async () => {
  const data = await load('?from=2026-11-07&through=2026-11-06');
  assert.equal(plannedRequests().length, 0);
  assert.match(render(data), /role="alert">This date range isn’t available/);
  for (const days of ['0', '-1', '2.5', 'Infinity', '999999999999']) {
    assert.match(render(await load('?mode=days&days=' + days)), /role="alert">Enter a valid whole number/);
  }
  assert.equal(plannedRequests().length, 0);
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

const extra = {
  id: '00000000-0000-4000-8000-000000000012', name: 'Ice', original_name: '氷', description: 'For drinks',
  quantities: [{ amount: 2, unit: 'bags' }, { amount: 500, unit: 'g' }],
};

test('extra ingredients load independently of the selected range and planned ingredients', async () => {
  vi.mocked(planningRequest).mockImplementation(async path => path === 'shopping-list-extras'
    ? Response.json({ items: [extra] }) : new Response(null, { status: 502 }));
  for (const query of ['?mode=days&days=1', '?mode=next-week', '?mode=all', '?mode=days&days=0']) {
    const html = render(await load(query));
    assert.match(html, /Extra ingredients/);
    assert.match(html, /<strong>Ice<\/strong> \(氷\).*For drinks/);
    assert.match(html, /2 bags \+ 500 g/);
    assert.match(html, /<button(?=[^>]*aria-label="Remove Ice")(?=[^>]*aria-haspopup="dialog")(?=[^>]*class="button ghost icon")[^>]*><svg[^>]*aria-hidden="true"/);
    assert.match(html, /<button(?=[^>]*aria-label="Edit Ice")(?=[^>]*aria-haspopup="dialog")(?=[^>]*class="button ghost icon")[^>]*><svg[^>]*aria-hidden="true"/);
    assert.match(html, /aria-haspopup="dialog"[^>]*>Add extra ingredient/);
    assert.match(html, /name="id" value="00000000-0000-4000-8000-000000000012"/);
  }
  assert.deepEqual(vi.mocked(planningRequest).mock.calls.filter(([path]) => path === 'shopping-list-extras'),
    Array.from({ length: 4 }, () => ['shopping-list-extras']));
});

test('an extras load failure does not mask the planned list or look like an empty extras list', async () => {
  vi.mocked(planningRequest).mockResolvedValueOnce(Response.json({ items: [] }))
    .mockResolvedValueOnce(new Response(null, { status: 502 }));
  const html = render(await load());
  assert.match(html, /No ingredients found for these dates/);
  assert.match(html, /role="alert">Could not load your extra ingredients/);
  assert.doesNotMatch(html, /No extra ingredients yet/);
});

test('the shared add/edit dialog includes the structured fields and prefills existing quantities', () => {
  const renderDialog = (item?: typeof extra) => renderWithRouter(createElement(ExtraIngredientEditor,
    { item, open: true, busy: false, onClose() {} }), '/shopping-list');
  const add = renderDialog();
  assert.match(add, /name="intent" value="add"/);
  assert.match(add, /name="name"/);
  assert.match(add, /name="original_name"/);
  assert.match(add, /name="description"/);
  assert.match(add, /Add quantity/);
  assert.doesNotMatch(add, /name="amount"/);
  const edit = renderDialog(extra);
  assert.match(edit, /name="intent" value="edit"/);
  assert.match(edit, /name="name" value="Ice"/);
  assert.match(edit, /name="original_name" value="氷"/);
  assert.match(edit, /name="description"[^>]*>For drinks/);
  assert.match(edit, /name="amount" value="2".*name="unit" value="bags"/);
  assert.match(edit, /name="amount" value="500".*name="unit" value="g"/);
  assert.match(edit, /<button(?=[^>]*aria-label="Remove quantity 2")(?=[^>]*type="button")[^>]*><svg[^>]*aria-hidden="true"/);
});

function change(fields: Record<string, string>, quantities: [string, string][] = []) {
  const body = new URLSearchParams(fields);
  for (const [amount, unit] of quantities) {
    body.append('amount', amount);
    body.append('unit', unit);
  }
  const request = new Request('http://localhost/shopping-list?mode=next-week', { method: 'POST', body });
  return clientAction({ request } as Route.ClientActionArgs);
}

test('adds and edits structured ingredients, then removes by id', async () => {
  vi.mocked(planningRequest).mockResolvedValueOnce(Response.json(extra, { status: 201 }))
    .mockResolvedValueOnce(Response.json(extra)).mockResolvedValueOnce(new Response(null, { status: 204 }));
  const { id, ...input } = extra;
  const added = await change({ intent: 'add', name: ' Ice ', original_name: ' 氷 ', description: ' For drinks ' }, [['2', ' bags '], ['500', 'g']]);
  assert.deepEqual(added, { message: 'Ingredient added.' });
  assert.deepEqual(await change({ intent: 'edit', id, name: 'Ice' }, [['3', '']]), { message: 'Ingredient updated.' });
  assert.deepEqual(await change({ intent: 'delete', id }), { message: 'Ingredient removed.' });
  assert.deepEqual(vi.mocked(planningRequest).mock.calls, [
    ['shopping-list-extras', { method: 'POST', body: JSON.stringify(input) }],
    ['shopping-list-extras', { method: 'PATCH', body: JSON.stringify({ name: 'Ice', quantities: [{ amount: 3, unit: null }], id }) }],
    ['shopping-list-extras', { method: 'DELETE', body: JSON.stringify({ id }) }],
  ]);
});

test('invalid extra ingredients are not sent, and failed writes are shown as errors', async () => {
  for (const name of ['  ', 'ice\nlemons', 'a'.repeat(201)]) {
    assert.match(JSON.stringify(await change({ intent: 'add', name })), /Enter a name/);
  }
  for (const amount of ['', '0', '-1', 'Infinity']) {
    assert.match(JSON.stringify(await change({ intent: 'add', name: 'Ice' }, [[amount, 'bags']])), /positive number/);
  }
  assert.deepEqual(await change({ intent: 'delete', id: 'invalid' }), { error: 'This extra ingredient isn’t available.' });
  assert.equal(vi.mocked(planningRequest).mock.calls.length, 0);

  vi.mocked(planningRequest).mockRejectedValueOnce(new Error('offline'));
  const result = await change({ intent: 'add', name: extra.name });
  assert.match(render(await load(), result), /role="alert">Could not add the ingredient/);
});

import assert from 'node:assert/strict';
import { createElement } from 'react';
import type { ShouldRevalidateFunctionArgs } from 'react-router';
import { afterEach, test, vi } from 'vitest';
import { navigation, renderWithRouter } from '../../../tests/support/router';
import { calendarWeek, localDate } from '../../lib/planning/calendar';
import { loadPlanning } from '../../lib/planning/overview.client';
import { deleteMealtime, reorderMealtimes, saveMealtime } from '../../lib/planning/mealtimes.client';
import Planning, { clientAction, clientLoader, handle, HydrateFallback, shouldRevalidate } from './route';
import { MealtimeControls } from './mealtime-controls';
import type { Route } from './+types/route';

vi.mock('../../lib/planning/overview.client', () => ({ loadPlanning: vi.fn() }));

vi.mock('../../lib/planning/mealtimes.client', () => ({
  deleteMealtime: vi.fn(), reorderMealtimes: vi.fn(), saveMealtime: vi.fn(),
}));

const today = '2026-11-06';
const week = calendarWeek(today, today);
const breakfast = { id: 'breakfast', name: 'Breakfast', position: 1, created_at: '', planned_meals_count: 0 };
const lunch = { id: 'lunch', name: 'Lunch', position: 2, created_at: '', planned_meals_count: 0 };
const planning = { mealtimes: [breakfast, lunch], entries: [], recipes: [], error: undefined };
const loaderData = { week, today, ...planning };

function render(data: unknown = loaderData, path = '/planning') {
  return renderWithRouter(createElement(Planning, { loaderData: data } as Route.ComponentProps), path);
}
function load(query = '') {
  return clientLoader({ request: new Request('http://localhost/planning' + query) } as Route.ClientLoaderArgs);
}
afterEach(() => vi.useRealTimers());

test('loader uses configured meal times and the week from the URL', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 6, 12));
  vi.mocked(loadPlanning).mockResolvedValue(planning);
  assert.deepEqual(await load('?week=2026-12-31'), {
    ...planning, week: calendarWeek('2026-12-31', today), today,
  });
  assert.deepEqual(vi.mocked(loadPlanning).mock.calls[0], [{ from: '2026-12-28', to: '2027-01-04' }]);
  assert.deepEqual(await load(), loaderData);
  assert.deepEqual(await load('?week=invalid'), loaderData);
});

test('loader preserves authentication redirects and recoverable load errors', async () => {
  const login = new Response(null, { status: 302, headers: { Location: '/auth/login' } });
  vi.mocked(loadPlanning).mockResolvedValue(login);
  assert.equal(await load(), login);
  vi.mocked(loadPlanning).mockResolvedValue({ ...planning, mealtimes: [], error: 'Could not load your meal times.' });
  const result = await load();
  assert.ok(!(result instanceof Response));
  assert.equal(result.error, 'Could not load your meal times.');
});

test('calendar presents seven dated columns and one equal-space row per meal, not per hour', () => {
  const html = render();
  assert.deepEqual(handle, { contentWidth: 'wide' });
  assert.match(html, /role="table" aria-labelledby="week-heading"/);
  assert.equal((html.match(/role="columnheader"/g) ?? []).length, 8);
  assert.equal((html.match(/role="row"/g) ?? []).length, 3);
  assert.equal((html.match(/role="cell"/g) ?? []).length, 14);
  assert.equal((html.match(/class="dayCell" role="cell"/g) ?? []).length, 14);
  assert.equal((html.match(/<span class="mealName">Breakfast<\/span>/g) ?? []).length, 1);
  assert.equal((html.match(/<span class="mealName">Lunch<\/span>/g) ?? []).length, 1);
  assert.match(html, /role="columnheader">Meal<\/div>/);
  assert.doesNotMatch(html, /Your week, one meal at a time|role="columnheader">Time/);
  assert.equal((html.match(/data-empty="true"/g) ?? []).length, 14);
  for (const day of week.days) assert.match(html, new RegExp(`dateTime="${day}"`));
  assert.doesNotMatch(html, /<footer|Each meal gets equal space|Recipe assignments are coming next/);
  assert.doesNotMatch(html, /<button[^>]*>Add recipe|No recipes planned|type="time"/);
});

test('slots link to a full page and show all assigned recipes only in their date/mealtime', () => {
  const html = render({ ...loaderData,
    recipes: [{ id: 'soup', title: 'Soup', subtitle: '' }, { id: 'toast', title: 'Toast', subtitle: '' }],
    entries: [
      { id: 'one', date: today, mealtime_id: 'lunch', recipe_id: 'soup', multiplier: 1 },
      { id: 'two', date: today, mealtime_id: 'lunch', recipe_id: 'toast', multiplier: 0.5 },
    ],
  });
  assert.equal((html.match(/class="slot"/g) ?? []).length, 14);
  assert.equal((html.match(/data-empty="true"/g) ?? []).length, 13);
  assert.equal((html.match(/data-empty="false"/g) ?? []).length, 1);
  assert.match(html, /data-empty="false" aria-label="Lunch, 2026-11-06: Soup, Toast"/);
  assert.match(html, /href="\/planning\/2026-11-06\/lunch"/);
  assert.match(html, /<li>Soup<\/li><li>Toast<span> · ×0.5<\/span><\/li>/);
  assert.equal((html.match(/<li>Soup<\/li>/g) ?? []).length, 1);
  assert.match(html, /Breakfast, 2026-11-02: Add recipe/);
});

test('the matrix renders meal rows in saved order without clock times or edit controls by default', () => {
  const html = render({ ...loaderData, mealtimes: [{ ...lunch, position: 1 }, { ...breakfast, position: 2 }] });
  assert.ok(html.indexOf('mealName">Lunch') < html.indexOf('mealName">Breakfast'));
  assert.doesNotMatch(html, /dateTime="\d{2}:\d{2}"|Move Lunch|Rename Lunch|Delete Lunch/);
  assert.match(html, /aria-pressed="false">Edit rows/);
  assert.match(html, /<button[^>]*aria-haspopup="dialog"[^>]*><span aria-hidden="true">\+ <\/span>Add meal time/);
});

test('row controls expose boundary state and explain deletion impact', () => {
  const html = renderWithRouter(createElement(MealtimeControls, {
    meal: { ...breakfast, planned_meals_count: 2 }, busy: false, first: true, last: false,
    onMove() {}, onRename() {},
  }));
  assert.match(html, /aria-label="Move Breakfast up" aria-disabled="true"/);
  assert.match(html, /aria-label="Move Breakfast down" aria-disabled="false"/);
  assert.match(html, /aria-label="Rename Breakfast"/);
  assert.match(html, /Deleting this meal time will also remove 2 planned meals across your plan/);
  assert.match(html, /Your recipes will be kept/);
});

test('navigation links preserve the selected week and work across year boundaries', () => {
  const html = render({ ...loaderData, week: calendarWeek('2027-01-01', today) });
  assert.match(html, /<a(?=[^>]*href="\/planning\?week=2026-12-21")(?=[^>]*aria-label="Previous week")[^>]*>/);
  assert.match(html, /<a(?=[^>]*href="\/planning\?week=2027-01-04")(?=[^>]*aria-label="Next week")[^>]*>/);
  assert.match(html, /<a[^>]*href="\/planning"[^>]*>Go to current week<\/a>/);
  assert.doesNotMatch(html, /href="\/meals"/);
});

test('today is marked in the desktop header and the compact day picker, never in meal cells', () => {
  const html = render();
  assert.equal((html.match(/aria-current="date"/g) ?? []).length, 1);
  assert.match(html, /role="columnheader" data-selected="true" aria-current="date"/);
  assert.equal((html.match(/data-today="true"/g) ?? []).length, 1);
  const other = render({ ...loaderData, week: calendarWeek('2026-11-09', today) });
  assert.doesNotMatch(other, /aria-current="date"|data-today="true"/);
});

test('compact view selects today by default and supports shareable day links', () => {
  const html = render();
  assert.match(html, /aria-label="Choose a day"/);
  assert.equal((html.match(/class="dayChoice"/g) ?? []).length, 7);
  assert.match(html, /<a(?=[^>]*href="\/planning\?week=2026-11-02&amp;day=2026-11-06")(?=[^>]*aria-current="page")[^>]*>/);
  assert.equal((html.match(/data-selected="true"/g) ?? []).length, 3);
  const selected = render(loaderData, '/planning?week=2026-11-02&day=2026-11-04');
  assert.match(selected, /<a(?=[^>]*href="\/planning\?week=2026-11-02&amp;day=2026-11-04")(?=[^>]*aria-current="page")[^>]*>/);
  assert.match(selected, /class="selectedDate"><h3>Wednesday, November 4, 2026/);
  for (const invalid of ['invalid', '2026-11-20']) {
    const fallback = render(loaderData, `/planning?day=${invalid}`);
    assert.match(fallback, /class="selectedDate"><h3>Friday, November 6, 2026/);
  }
  const otherWeek = render({ ...loaderData, week: calendarWeek('2026-11-09', today) });
  assert.match(otherWeek, /class="selectedDate"><h3>Monday, November 9, 2026/);
});

test('changing only the compact day reuses week data, while week changes, writes, and retries revalidate', () => {
  function revalidate(current: string, next: string, extra: Partial<ShouldRevalidateFunctionArgs> = {}) {
    return shouldRevalidate({
      currentUrl: new URL(current, 'http://localhost'), nextUrl: new URL(next, 'http://localhost'),
      defaultShouldRevalidate: true, ...extra,
    } as ShouldRevalidateFunctionArgs);
  }
  assert.equal(revalidate('/planning?week=2026-11-02', '/planning?week=2026-11-02&day=2026-11-04'), false);
  assert.equal(revalidate('/planning?day=2026-11-04', '/planning?day=2026-11-06'), false);
  assert.equal(revalidate('/planning?week=2026-11-02', '/planning?week=2026-11-09'), true);
  assert.equal(revalidate('/planning?day=2026-11-04', '/planning?day=2026-11-06', { formMethod: 'POST' }), true);
  assert.equal(revalidate('/planning?day=2026-11-04', '/planning?day=2026-11-04'), true);
  assert.equal(revalidate('/planning?day=2026-11-04', '/planning?day=2026-11-04', { defaultShouldRevalidate: false }), false);
});

test('empty state offers inline meal setup; failed loads offer retry rather than an empty calendar', () => {
  const html = render({ ...loaderData, mealtimes: [] });
  assert.match(html, /Give your week a rhythm/);
  assert.match(html, /aria-haspopup="dialog"[^>]*><span aria-hidden="true">\+ <\/span>Add meal time/);
  assert.doesNotMatch(html, /Edit rows/);
  assert.doesNotMatch(html, /role="table"/);
  const error = render({ ...loaderData, mealtimes: [], error: 'Please try again.' });
  assert.match(error, /role="alert">Please try again/);
  assert.match(error, /Try again/);
  assert.doesNotMatch(error, /Give your week a rhythm|role="table"/);
});

test('planning handles meal row mutations in place', async () => {
  const act = (fields: [string, string][]) => clientAction({
    request: new Request('http://localhost/planning?week=2026-11-02&day=2026-11-06', {
      method: 'POST', body: new URLSearchParams(fields),
    }),
  } as Route.ClientActionArgs);
  await act([['intent', 'create'], ['name', 'Breakfast']]);
  await act([['intent', 'update'], ['id', 'breakfast'], ['name', 'Brunch']]);
  await act([['intent', 'delete'], ['id', 'lunch']]);
  await act([['intent', 'reorder'], ['ids', 'lunch'], ['ids', 'breakfast']]);
  assert.deepEqual(vi.mocked(saveMealtime).mock.calls, [[null, { name: 'Breakfast' }], ['breakfast', { name: 'Brunch' }]]);
  assert.deepEqual(vi.mocked(deleteMealtime).mock.calls, [['lunch']]);
  assert.deepEqual(vi.mocked(reorderMealtimes).mock.calls, [[['lunch', 'breakfast']]]);
  assert.deepEqual(await act([['intent', 'update']]), { error: 'This meal time isn’t available.' });
});

test('loading and pending states are accessible', () => {
  assert.match(renderWithRouter(createElement(HydrateFallback)), /role="status">Loading your week/);
  navigation.state = 'loading';
  assert.match(render(), /aria-busy="true"/);
  assert.match(render({ ...loaderData, error: 'Failed.' }), /disabled="">Trying again…/);
});

test('slot names are escaped and the current week is calculated at load time', () => {
  const html = render({ ...loaderData, mealtimes: [{ ...breakfast, name: '<img src=x>' }] });
  assert.match(html, /&lt;img src=x&gt;/);
  assert.doesNotMatch(html, /<img/);
  assert.match(localDate(), /^\d{4}-\d{2}-\d{2}$/);
});

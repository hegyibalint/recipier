import assert from 'node:assert/strict';
import { createElement } from 'react';
import { test, vi } from 'vitest';
import { navigation, renderWithRouter } from '../../../tests/support/router';
import { deleteMealtime, loadMealtimes, saveMealtime } from '../../lib/planning/mealtimes.client';
import Meals, { clientAction, clientLoader, HydrateFallback } from './route';
import type { Route } from './+types/route';

vi.mock('../../lib/planning/mealtimes.client', () => ({
  loadMealtimes: vi.fn(), saveMealtime: vi.fn(), deleteMealtime: vi.fn(),
}));
const id = '12345678-1234-4234-8234-123456789abc';
const meal = { id, name: 'Lunch', starts_at: '12:00', ends_at: '13:00', created_at: '2026-11-06T10:00:00Z', planned_meals_count: 3 };
const loaderData = { mealtimes: [meal] };

function render(data: unknown = loaderData, actionData?: unknown) {
  return renderWithRouter(createElement(Meals, { loaderData: data, actionData } as Route.ComponentProps), '/meals');
}
function action(form: Record<string, string>, method = 'POST') {
  return clientAction({
    request: new Request('http://localhost/meals', { method, body: new URLSearchParams(form) }),
  } as Route.ClientActionArgs);
}

test('loader uses the mealtimes store', async () => {
  vi.mocked(loadMealtimes).mockResolvedValue(loaderData);
  assert.deepEqual(await clientLoader(), loaderData);
});

test('create/update actions trim names and forward only editable fields', async () => {
  const fields = { name: '  Lunch  ', starts_at: '12:00', ends_at: '13:00', user_id: 'untrusted' };
  vi.mocked(saveMealtime).mockResolvedValue({ message: 'Saved.' });
  assert.deepEqual(await action({ ...fields, intent: 'create', id: 'ignored' }), { message: 'Saved.' });
  await action({ ...fields, intent: 'update', id });
  assert.deepEqual(vi.mocked(saveMealtime).mock.calls, [
    [null, { name: 'Lunch', starts_at: '12:00', ends_at: '13:00' }],
    [id, { name: 'Lunch', starts_at: '12:00', ends_at: '13:00' }],
  ]);
});

test('only explicit POST intents mutate; update/delete require IDs', async () => {
  for (const form of [{ intent: 'unknown' }, { intent: 'update' }, { intent: 'delete' }]) {
    assert.ok((await action(form) as { error: string }).error);
  }
  assert.deepEqual(await action({ intent: 'delete', id }, 'PUT'), { error: 'Unknown action.' });
  assert.equal(vi.mocked(saveMealtime).mock.calls.length, 0);
  assert.equal(vi.mocked(deleteMealtime).mock.calls.length, 0);
  vi.mocked(deleteMealtime).mockResolvedValue({ message: 'Deleted.' });
  assert.deepEqual(await action({ intent: 'delete', id }), { message: 'Deleted.' });
  assert.deepEqual(vi.mocked(deleteMealtime).mock.calls, [[id]]);
});

test('lists named slots with local times and accessible add/edit forms', () => {
  const html = render();
  assert.match(html, /<h1[^>]*>Meals<\/h1>/);
  assert.match(html, /<h3>Lunch<\/h3>/);
  assert.match(html, /<time dateTime="12:00">12:00<\/time>/);
  assert.match(html, /<details[^>]*><summary>Edit <span[^>]*>Lunch<\/span><\/summary>/);
  assert.match(html, /value="update"/);
  assert.match(html, /value="create"/);
  assert.match(html, /<input(?=[^>]*name="name")(?=[^>]*required="")[^>]*>/);
  assert.match(html, /placeholder="HH:MM"/);
  assert.match(html, /Add meal time/);
  assert.match(html, /aria-label="Delete Lunch"[^>]*>Delete<\/button>/);
  assert.match(html, /aria-label="Save Lunch"[^>]*>Save<\/button>/);
  assert.doesNotMatch(html, /This section isn’t available|recipe_id|multiplier/);
});

test('each card footer puts a delete trigger before Save, with a separate confirmation form', () => {
  const html = render();
  assert.match(html, new RegExp(`<form[^>]*id="${id}-form"[^>]*>`));
  assert.match(html, /<\/fieldset><\/form><footer class="actions"><button(?=[^>]*type="button")(?=[^>]*aria-haspopup="dialog")[^>]*>Delete<\/button><dialog/);
  assert.match(html, new RegExp(`<button(?=[^>]*class="button primary saveButton")(?=[^>]*type="submit")(?=[^>]*form="${id}-form")[^>]*>Save<\\/button><\\/footer>`));
  assert.ok(html.indexOf('>Delete</button>') < html.indexOf('>Save</button>'));
  const deleteForm = html.match(/<dialog[\s\S]*?<form[\s\S]*?<\/form>/)?.[0] ?? '';
  assert.match(deleteForm, new RegExp(`<input(?=[^>]*type="hidden")(?=[^>]*name="id")(?=[^>]*value="${id}")[^>]*>`));
  assert.doesNotMatch(deleteForm, /name="name"|name="starts_at"|name="ends_at"/);
  assert.match(html, /<div class="actions"><button(?=[^>]*class="button primary saveButton")(?=[^>]*type="submit")[^>]*>Add meal time<\/button>/);
});

test('time entry and display consistently use 24-hour HH:MM, independent of browser locale', () => {
  const html = render({ mealtimes: [{ ...meal, name: 'Dinner', starts_at: '18:00', ends_at: '19:30' }] });
  assert.match(html, /<time dateTime="18:00">18:00<\/time>/);
  assert.match(html, /<time dateTime="19:30">19:30<\/time>/);
  assert.doesNotMatch(html, /type="time"/);
  const timeInputs = [...html.matchAll(/<input[^>]*pattern="([^"]+)"[^>]*>/g)];
  assert.equal(timeInputs.length, 4);
  for (const [input, pattern] of timeInputs) {
    assert.match(input, /type="text"/);
    assert.match(input, /aria-describedby="[^"]+-time-hint"/);
    const format = new RegExp(`^(?:${pattern})$`);
    for (const value of ['00:00', '09:05', '12:00', '18:30', '23:59']) assert.ok(format.test(value));
    for (const value of ['6:30 PM', '06:30 AM', '24:00', '12:60', '9:05', '18:30:00']) assert.ok(!format.test(value));
  }
  assert.match(html, /24-hour local time \(HH:MM\)/);
});

test('empty, error, success, and hydration states are explicit', () => {
  const empty = render({ mealtimes: [] });
  assert.match(empty, /No meal times yet/);
  assert.match(empty, /Add meal time/);
  const error = render({ mealtimes: [], error: 'Could not load meal times.' });
  assert.match(error, /role="alert">Could not load meal times/);
  assert.match(error, /Try again/);
  assert.doesNotMatch(error, /<form/);
  assert.match(render(loaderData, { error: 'Could not save.' }), /role="alert">Could not save/);
  assert.match(render(loaderData, { message: 'Meal time added.' }), /role="status">Meal time added/);
  assert.match(renderWithRouter(createElement(HydrateFallback)), /role="status">Loading your meal times/);
});

test('pending navigation disables all mutations', () => {
  navigation.state = 'submitting';
  const html = render();
  assert.match(html, /aria-busy="true"/);
  assert.equal((html.match(/<fieldset disabled="">/g) ?? []).length, 2);
  assert.match(html, /<button(?=[^>]*value="delete")(?=[^>]*disabled="")[^>]*>/);
  assert.match(html, /<button(?=[^>]*aria-label="Save Lunch")(?=[^>]*disabled="")[^>]*>/);
  assert.match(html, /Please wait…/);
});

test('delete names the meal in a native confirmation dialog rather than submitting the edit draft', () => {
  const html = render();
  assert.match(html, /<dialog[^>]*aria-labelledby="[^"]+"/);
  assert.match(html, /<h2[^>]*>Delete “Lunch”\?<\/h2>/);
  assert.match(html, /This cannot be undone/);
  assert.match(html, /<button(?=[^>]*type="submit")(?=[^>]*form="[^"]+")(?=[^>]*name="intent")(?=[^>]*value="delete")[^>]*>Delete meal time<\/button>/);
});

test('confirmation explains the exact cascade impact for zero, one, and many planned meals', () => {
  for (const [count, usage, impact] of [
    [0, 'This mealtime is not used by any planned meals.', null],
    [1, 'This mealtime is used by 1 planned meal.', 'Deleting it will also remove that meal from your plan.'],
    [42, 'This mealtime is used by 42 planned meals.', 'Deleting it will also remove those meals from your plan.'],
  ] as const) {
    const html = render({ mealtimes: [{ ...meal, planned_meals_count: count }] });
    assert.ok(html.includes(usage));
    if (impact) assert.ok(html.includes(impact));
    else assert.doesNotMatch(html, /Deleting it will also remove/);
    assert.match(html, /Your recipes will be kept\./);
    assert.match(html, /This cannot be undone\. Are you sure you want to delete it\?/);
  }
});

test('meal names are escaped rather than interpreted as HTML', () => {
  const html = render({ mealtimes: [{ ...meal, name: '<img src=x onerror=alert(1)>' }] });
  assert.match(html, /&lt;img/);
  assert.doesNotMatch(html, /<img/);
});

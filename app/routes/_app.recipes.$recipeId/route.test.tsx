import assert from 'node:assert/strict';
import { createElement } from 'react';
import { test, vi } from 'vitest';
import { navigation, renderWithRouter } from '../../../tests/support/router.tsx';
import { document, id, row } from '../../../tests/support/recipes.ts';
import * as router from 'react-router';
import { deleteRecipe, renameRecipe } from '../../lib/recipes/store.client.ts';
import * as page from './route.tsx';
import type { Route } from './+types/route';

vi.mock('../../lib/recipes/store.client.ts', () => ({ loadRecipe: vi.fn(), deleteRecipe: vi.fn(), renameRecipe: vi.fn() }));

const Recipe = page.default;
type Options = {
  navigation?: { state: typeof navigation.state; formData?: FormData };
  deleteRecipe?: typeof deleteRecipe;
};
function pageModule(options: Options = {}) {
  Object.assign(navigation, { state: 'idle', formData: undefined }, options.navigation);
  vi.mocked(deleteRecipe).mockReset();
  if (options.deleteRecipe) vi.mocked(deleteRecipe).mockImplementation(options.deleteRecipe);
  return page;
}
function renderPage(loaderData: unknown, actionData?: unknown, options?: Options) {
  pageModule(options);
  return renderWithRouter(createElement(Recipe, { loaderData, actionData } as Route.ComponentProps));
}

test('detail action only deletes for an explicit POST delete intent using the route ID', async () => {
  const calls: string[] = [];
  const { clientAction } = pageModule({ deleteRecipe: async recipeId => { calls.push(recipeId); return router.redirect('/'); } });
  const action = (intent: string, method = 'POST') => clientAction({
    params: { recipeId: id },
    request: new Request('http://localhost/recipes/' + id, { method, body: new URLSearchParams({ intent, recipeId: 'untrusted' }) }),
  } as Route.ClientActionArgs);
  assert.deepEqual(await action('unknown'), { error: 'Unknown action.' });
  assert.deepEqual(await action('delete', 'PUT'), { error: 'Unknown action.' });
  assert.deepEqual(calls, []);
  const result = await action('delete');
  assert.ok(result instanceof Response);
  assert.equal(result.headers.get('Location'), '/');
  assert.deepEqual(calls, [id]);
});

test('rename action uses the route ID and forwards only the title', async () => {
  vi.mocked(renameRecipe).mockResolvedValue({ savedTitle: 'New title' });
  const result = await page.clientAction({
    params: { recipeId: id },
    request: new Request('http://localhost/recipes/' + id, {
      method: 'POST', body: new URLSearchParams({ intent: 'rename', title: 'New title', recipeId: 'untrusted' }),
    }),
  } as Route.ClientActionArgs);
  assert.deepEqual(result, { savedTitle: 'New title' });
  assert.deepEqual(vi.mocked(renameRecipe).mock.calls, [[id, 'New title']]);
});

test('delete uses a non-submitting trigger and a named native confirmation dialog', () => {
  const html = renderPage({ recipe: row });
  assert.match(html, /<button(?=[^>]*type="button")(?=[^>]*aria-haspopup="dialog")[^>]*>Delete recipe<\/button>/);
  assert.match(html, /<dialog[^>]*aria-labelledby="[^"]+"/);
  assert.match(html, /<h2[^>]*>Delete “Garlic butter”\?<\/h2>/);
  assert.match(html, /This cannot be undone/);
  assert.match(html, /class="button secondary"[^>]*>Cancel<\/button>/);
  assert.match(html, /<button(?=[^>]*class="button danger")(?=[^>]*type="submit")(?=[^>]*form="[^"]+")(?=[^>]*name="intent")(?=[^>]*value="delete")[^>]*>Delete recipe<\/button>/);
});

test('delete control has pending and error states and is absent for unavailable recipes', () => {
  assert.match(renderPage({ recipe: row }), /<button(?=[^>]*name="intent")(?=[^>]*value="delete")[^>]*>Delete recipe/);
  const formData = new FormData();
  formData.set('intent', 'delete');
  const pending = renderPage({ recipe: row }, undefined, { navigation: { state: 'submitting', formData } });
  assert.match(pending, /<button(?=[^>]*disabled="")[^>]*>Deleting…/);
  assert.match(pending, /aria-busy="true"/);
  assert.match(renderPage({ recipe: row }, { error: 'Could not delete this recipe.' }), /role="alert">Could not delete this recipe/);
  assert.doesNotMatch(renderPage({ recipe: null, notFound: true }), /Delete recipe/);
  assert.doesNotMatch(renderPage({ recipe: null, error: 'Try again.' }), /Delete recipe/);
});

test('full page shows metadata, ingredients, all components, dependencies, and resolved steps without disclosure', () => {
  const html = renderPage({ recipe: row });
  const plainText = html.replace(/<[^>]*>/g, '');
  assert.match(html, /<h1 class="title"><span[^>]*><span[^>]*>Garlic butter<\/span><button[^>]*aria-label="Edit recipe title".*<\/button><\/span><\/h1>/);
  assert.match(html, /<p class="subtitle">A rich, savory finishing butter<\/p>/);
  for (const text of ['Garlic butter', document.subtitle, 'A simple spread.', 'Keep chilled.', 'Makes 100 g', 'Ingredients',
    'Butter base', 'Serve', 'Prepare first: Butter base', 'Soften 100 g butter.', 'Serve Butter base.']) {
    assert.ok(plainText.includes(text), `Missing ${text}`);
  }
  assert.match(html, /href="\/"/);
  assert.doesNotMatch(html, /<details|\$\{[ic]:|class="panel|class="eyebrow"|Amounts are shown/);
  assert.ok(html.indexOf('Saved <time') > html.indexOf('<footer'));
  assert.deepEqual(pageModule().meta({ loaderData: { recipe: row } } as Route.MetaArgs), [{ title: 'Garlic butter · Recipier' }]);
});

test('yield is a compact, disabled visual control beside the title', () => {
  const html = renderPage({ recipe: row });
  assert.match(html, /<div class="titleRow"><div class="titleGroup"><form[^>]*class="titleEditor".*<p class="subtitle">[^<]+<\/p><\/div><div[^>]*class="stepper yieldControl"/);
  assert.match(html, /role="group" aria-label="Recipe yield"/);
  assert.match(html, /<button(?=[^>]*aria-label="Decrease yield")(?=[^>]*disabled="")[^>]*><span aria-hidden="true">−<\/span><\/button>/);
  assert.match(html, /class="label" aria-live="polite">100 g<\/div>/);
  assert.match(html, /<button(?=[^>]*aria-label="Increase yield")(?=[^>]*disabled="")[^>]*><span aria-hidden="true">\+<\/span><\/button>/);
  const noYield = renderPage({ recipe: { ...row, document: { ...document, yield: undefined } } });
  assert.doesNotMatch(noYield, /yieldControl|Decrease yield|Increase yield/);
});

test('only valid ingredient references are highlighted, including quantities and repeated mentions', () => {
  const html = renderPage({ recipe: { ...row, document: {
    ...document,
    components: [{ ...document.components[0], steps: [{ text: 'Prepare base.' }] }, {
      id: 'main',
      steps: [{ text: 'Butter: ${i:butter:100:g}; stir ${i:butter}. Serve ${c:base}. Show \\${i:butter}, ${i:missing}, ${i:butter:0:g}.' }],
    }],
  } } });
  assert.match(html, /<span class="ingredientReference">100 g butter<\/span>/);
  assert.match(html, /<span class="ingredientReference">butter<\/span>/);
  assert.equal((html.match(/class="ingredientReference"/g) ?? []).length, 2);
  assert.match(html, /Serve Butter base\./);
  assert.match(html, /Show \$\{i:butter\}, \$\{i:missing\}, \$\{i:butter:0:g\}/);
});

test('ingredient reference labels are escaped, never interpreted as HTML', () => {
  const html = renderPage({ recipe: { ...row, document: {
    ...document, ingredients: [{ id: 'butter', name: '<img src=x onerror=alert(1)>' }],
  } } });
  assert.match(html, /<span class="ingredientReference">100 g &lt;img src=x onerror=alert\(1\)&gt;<\/span>/);
  assert.doesNotMatch(html, /<img/);
});

test('optional fields, empty ingredients, and component title fallbacks render safely', () => {
  const html = renderPage({ recipe: { ...row, document: {
    title: '<script>alert(1)</script>', subtitle: 'A simple preparation', description: 'A plain-text recipe.', ingredients: [],
    components: [{ id: 'main', steps: [{ text: '<img src=x onerror=alert(1)>' }] }],
  } } });
  assert.match(html, /No ingredients listed/);
  assert.match(html, /<h2 class="section-title">main<\/h2>/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script|<img|Makes /);
});

test('not-found, retry, and hydration states render', () => {
  assert.match(renderPage({ recipe: null, notFound: true }), /Recipe not found/);
  const errorHtml = renderPage({ recipe: null, error: 'Please try again.' });
  assert.match(errorHtml, /role="alert"/);
  assert.match(errorHtml, /Try again/);
  const { HydrateFallback } = pageModule();
  const html = renderWithRouter(createElement(HydrateFallback));
  assert.match(html, /role="status"/);
  assert.match(html, /Loading your recipe/);
});

test('subtitles are escaped on detail pages', () => {
  const unsafe = { ...row, document: { ...document, subtitle: '<img src=x onerror=alert(1)>' } };
  const html = renderPage({ recipe: unsafe });
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html, /<img/);
});

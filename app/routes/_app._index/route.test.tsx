import assert from 'node:assert/strict';
import { createElement } from 'react';
import { test, vi } from 'vitest';
import { renderWithRouter } from '../../../tests/support/router.tsx';
import { document, row } from '../../../tests/support/recipes.ts';
import type { RecipeRow } from '../../lib/recipes/store.client.ts';
import Recipes from './route.tsx';
import type { Route } from './+types/route';

vi.mock('../../lib/auth/session.client.ts', () => ({ errorMessage: vi.fn(), signOut: vi.fn() }));
vi.mock('../../lib/recipes/store.client.ts', () => ({ loadRecipes: vi.fn(), recipeLimit: 50 }));

function renderCards(recipes: RecipeRow[], path = '/') {
  return renderWithRouter(createElement(Recipes, { loaderData: { recipes } } as Route.ComponentProps), path);
}

test('recipe cards present a linked title, supporting subtitle, and description in order', () => {
  const html = renderCards([row]);
  assert.match(html, /<h2><a[^>]+>Garlic butter<\/a><\/h2><p class="subtitle">A rich, savory finishing butter<\/p>/);
  assert.ok(html.indexOf(document.subtitle) < html.indexOf('A simple spread.'));
  assert.match(html, /href="\/recipes\/12345678-1234-4234-8234-123456789abc"/);
});

test('recipe cards group their heading, description, and footer metadata', () => {
  const html = renderCards([row]);
  assert.match(html, /<header class="cardHeading">.*<h2>.*<\/header><p class="recipe-text description">/s);
  assert.match(html, /<footer class="metadata"><p>Makes 100 g<\/p><p class="savedAt">Saved <time/);
  assert.ok(html.indexOf('Keep chilled.') < html.indexOf('<footer'));
});

test('serving yields read naturally, while missing yields leave only the saved date', () => {
  const servings = { ...row, document: { ...document, yield: { amount: 2, unit: 'servings' } } };
  assert.match(renderCards([servings]), /Serves 2/);
  const withoutYield = { ...row, document: { ...document, yield: undefined } };
  const html = renderCards([withoutYield]);
  assert.match(html, /<footer class="metadata"><p class="savedAt">Saved/);
  assert.doesNotMatch(html, /Makes|Serves/);
});

test('the recipe list avoids redundant controls and navigation', () => {
  const html = renderCards([row]);
  assert.doesNotMatch(html, /<button|<nav/);
  assert.doesNotMatch(html, /Refresh|ChatGPT|create_recipe|Quick preview|View full recipe/);
});

test('the empty state is simple and does not suggest hidden controls', () => {
  const html = renderCards([]);
  assert.match(html, /No recipes yet/);
  assert.match(html, /Your saved recipes will appear here/);
  assert.doesNotMatch(html, /Refresh|ChatGPT/);
});

test('search matches titles, subtitles, and descriptions without case sensitivity', () => {
  for (const query of ['  GARLIC  ', 'SAVORY', 'CHILLED']) {
    const html = renderCards([row], '/?q=' + encodeURIComponent(query));
    assert.match(html, /<article/);
    assert.doesNotMatch(html, /No matching recipes/);
  }
});

test('unmatched searches offer a way back to all recipes', () => {
  const html = renderCards([row], '/?q=pancakes');
  assert.match(html, /No matching recipes/);
  assert.match(html, /href="\/"[^>]*>All recipes/);
  assert.doesNotMatch(html, /<article/);
});

test('blank searches preserve the full recipe list', () => {
  const html = renderCards([row], '/?q=%20%20');
  assert.match(html, /<article/);
  assert.doesNotMatch(html, /No matching recipes/);
});

test('subtitles are escaped on recipe cards', () => {
  const unsafe = { ...row, document: { ...document, subtitle: '<img src=x onerror=alert(1)>' } };
  for (const html of [renderCards([unsafe])]) {
    assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.doesNotMatch(html, /<img/);
  }
});

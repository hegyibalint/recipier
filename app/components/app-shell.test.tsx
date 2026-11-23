import assert from 'node:assert/strict';
import { test } from 'vitest';
import { renderWithRouter } from '../../tests/support/router';
import { AppShell } from './app-shell';

test('the shell provides all four destinations with one active link', () => {
  const html = renderWithRouter(<AppShell>Page content</AppShell>);
  assert.match(html, /aria-label="Primary"/);
  for (const [path, label] of [['/', 'Recipes'], ['/meals', 'Meals'], ['/planning', 'Planning'], ['/shopping-list', 'Shopping list']]) {
    assert.ok(html.includes('href="' + path + '"'));
    assert.ok(html.includes('>' + label + '</a>'));
  }
  assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
  assert.match(html, /<main[^>]*id="main-content"/);
  assert.match(html, /href="#main-content"/);
});

test('Planning stays active on a slot page without marking Recipes active', () => {
  const html = renderWithRouter(<AppShell>Slot</AppShell>, '/planning/2026-11-06/meal-id');
  assert.equal((html.match(/aria-current="location"/g) ?? []).length, 1);
  assert.match(html, /<a(?=[^>]*href="\/planning")(?=[^>]*aria-current="location")[^>]*>Planning<\/a>/);
});

test('the header search uses a capsule trigger and an accessible search dialog', () => {
  const html = renderWithRouter(<AppShell>Recipes</AppShell>);
  assert.match(html, /class="surface capsule"/);
  assert.match(html, /aria-haspopup="dialog" aria-label="Search recipes"/);
  assert.match(html, /<dialog[^>]*aria-labelledby="[^"]+"/);
  assert.match(html, /<h2[^>]*>Search recipes<\/h2>/);
  assert.match(html, /<form(?=[^>]*action="\/")(?=[^>]*method="get")(?=[^>]*role="search")/);
  assert.match(html, /class="surface field"/);
  assert.match(html, /<input(?=[^>]*type="search")(?=[^>]*name="q")(?=[^>]*aria-label="Search recipes")/);
  assert.match(html, /<svg[^>]*aria-hidden="true"/);
});

test('a single header sign-out posts to the explicit logout route at every screen size', () => {
  const html = renderWithRouter(<AppShell loading>Loading</AppShell>);
  assert.equal((html.match(/action="\/auth\/logout"/g) ?? []).length, 1);
  assert.equal((html.match(/disabled=""/g) ?? []).length, 1);
  assert.match(html, /<div class="headerActions">.*action="\/auth\/logout".*<\/header>/s);
});

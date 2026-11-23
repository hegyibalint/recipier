import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { test } from 'vitest';
import { document } from '../../tests/support/recipes.ts';
import { RecipeContents } from './recipe-contents.tsx';

test('ingredient totals combine matching units and keep different units separated in full and preview views', () => {
  const recipe = {
    ...document,
    ingredients: [
      { id: 'salt', name: 'Salt' },
      { id: 'eggs', name: 'Eggs' },
      { id: 'pepper', name: 'Pepper' },
      { id: 'unused', name: 'Unused' },
    ],
    components: [
      { id: 'base', steps: [{ text: 'Add ${i:salt:10:g}, ${i:salt:2:pinch}, ${i:eggs:2}, and ${i:pepper}.' }] },
      { id: 'finish', depends_on: ['base'], steps: [
        { text: 'Use ${c:base:2}, ${i:salt:5:g}, and ${i:eggs:1}.' },
        { text: 'Mix ${i:salt} and ${i:pepper}. Literal: \\${i:salt:100:g}.' },
      ] },
    ],
  };
  for (const variant of ['full', 'preview'] as const) {
    const html = renderToStaticMarkup(createElement(RecipeContents, { recipe, variant }));
    assert.match(html, /<li>Salt: 15g \+ 2 pinch<\/li>/);
    assert.match(html, /<li>Eggs: 3<\/li>/);
    assert.match(html, /<li>Pepper<\/li>/);
    assert.match(html, /<li>Unused<\/li>/);
  }
});

test('recipe contents owns its full/preview variant and accepts page layout classes', () => {
  const full = renderToStaticMarkup(createElement(RecipeContents, { recipe: document, className: 'pageLayout' }));
  assert.match(full, /class="contents full pageLayout"/);
  assert.match(full, /<h2>Ingredients<\/h2>/);
  assert.match(full, /class="dependency">Prepare first: Butter base<\/p>/);
  assert.doesNotMatch(full, /class="muted"/);

  const preview = renderToStaticMarkup(createElement(RecipeContents, { recipe: document, headingLevel: 3, variant: 'preview' }));
  assert.match(preview, /class="contents"/);
  assert.doesNotMatch(preview, /class="[^"]*\bfull\b/);
  assert.match(preview, /<h3>Ingredients<\/h3>/);
});

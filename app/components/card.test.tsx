import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { test } from 'vitest';
import { Card } from './card';

test('cards provide a shared surface without imposing content or layout', () => {
  const html = renderToStaticMarkup(<Card><p>Contents</p></Card>);
  assert.equal(html, '<div class="surface"><p>Contents</p></div>');
});

test('capsule cards opt into a rounded shape without leaking custom props', () => {
  const html = renderToStaticMarkup(<Card shape="capsule">Search</Card>);
  assert.equal(html, '<div class="surface capsule">Search</div>');
});

test('cards support semantic recipe containers and caller classes', () => {
  const html = renderToStaticMarkup(<Card as="article" className="recipe" aria-labelledby="recipe-title">
    <h2 id="recipe-title">Pancakes</h2>
  </Card>);
  assert.match(html, /^<article aria-labelledby="recipe-title" class="surface recipe">/);
  assert.match(html, /<h2 id="recipe-title">Pancakes<\/h2><\/article>$/);
});

test('cards preserve accessible control-group attributes and native children', () => {
  const html = renderToStaticMarkup(<Card role="group" aria-label="Recipe yield" title="Coming soon">
    <button type="button" disabled>−</button><span>4 bowls</span>
  </Card>);
  assert.match(html, /role="group" aria-label="Recipe yield" title="Coming soon"/);
  assert.match(html, /<button type="button" disabled="">−<\/button><span>4 bowls<\/span>/);
});

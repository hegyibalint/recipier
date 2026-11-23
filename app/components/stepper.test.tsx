import assert from 'node:assert/strict';
import { test } from 'vitest';
import { renderWithRouter } from '../../tests/support/router';
import { Stepper } from './stepper';

const previous = { label: 'Decrease servings', icon: '−' };
const next = { label: 'Increase servings', icon: '+' };

test('stepper places the live label first with both accessible native buttons on the right', () => {
  const html = renderWithRouter(<Stepper aria-label="Servings" label="4 servings"
    previous={{ ...previous, onClick() {} }} next={{ ...next, onClick() {} }} />);
  assert.match(html, /role="group" aria-label="Servings"/);
  assert.equal((html.match(/type="button"/g) ?? []).length, 2);
  assert.match(html, /<div class="label" aria-live="polite">4 servings<\/div><button[^>]*aria-label="Decrease servings"><span aria-hidden="true">−<\/span><\/button><button[^>]*aria-label="Increase servings"/);
  assert.doesNotMatch(html, /disabled|<a/);
});

test('stepper renders the heading before adjacent previous/next navigation links', () => {
  const html = renderWithRouter(<Stepper aria-label="Weeks" label={<h2 id="week">Nov 2–8</h2>}
    previous={{ label: 'Previous week', icon: '←', to: '?week=2026-10-26' }}
    next={{ label: 'Next week', icon: '→', to: '?week=2026-11-09' }} />);
  assert.equal((html.match(/<a /g) ?? []).length, 2);
  assert.match(html, /<a(?=[^>]*href="\/\?week=2026-10-26")(?=[^>]*aria-label="Previous week")[^>]*>/);
  assert.match(html, /<h2 id="week">Nov 2–8<\/h2><\/div><a[^>]*aria-label="Previous week"[^>]*>[\s\S]*?<\/a><a[^>]*aria-label="Next week"/);
  assert.doesNotMatch(html, /<button/);
});

test('unavailable actions are disabled buttons, while the opposite action can still be a link', () => {
  const html = renderWithRouter(<Stepper aria-label="Weeks" label="First week" title="Week navigation"
    previous={{ label: 'Previous week', icon: '←', disabled: true }}
    next={{ label: 'Next week', icon: '→', to: '?week=next' }} />);
  assert.match(html, /title="Week navigation"/);
  assert.match(html, /<button[^>]*disabled=""[^>]*aria-label="Previous week"/);
  assert.equal((html.match(/<a /g) ?? []).length, 1);
});

test('text labels are escaped and the caller can supply a layout class', () => {
  const html = renderWithRouter(<Stepper aria-label="Yield" className="yieldLayout" label="<img src=x>"
    previous={{ ...previous, disabled: true }} next={{ ...next, disabled: true }} />);
  assert.match(html, /class="stepper yieldLayout"/);
  assert.doesNotMatch(html, /class="surface/);
  assert.match(html, /&lt;img src=x&gt;/);
  assert.doesNotMatch(html, /<img/);
});

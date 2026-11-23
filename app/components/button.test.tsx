import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { test, vi } from 'vitest';
import { Button } from './button';

test('buttons default to the borderless primary presentation without implicitly submitting forms', () => {
  const html = renderToStaticMarkup(<Button>Save</Button>);
  assert.match(html, /type="button" class="button primary">Save<\/button>/);
});

test('secondary actions use the shared white-surface presentation', () => {
  const html = renderToStaticMarkup(<Button variant="secondary">Cancel</Button>);
  assert.match(html, /class="button secondary">Cancel<\/button>/);
});

test('destructive actions have an explicit danger variant', () => {
  const html = renderToStaticMarkup(<Button variant="danger">Delete recipe</Button>);
  assert.match(html, /class="button danger">Delete recipe<\/button>/);
});

test('submit buttons preserve native form association, intent, accessibility, and disabled state', () => {
  const html = renderToStaticMarkup(<Button type="submit" form="meal-form" name="intent" value="update"
    className="footerAction" disabled aria-label="Save Lunch">Save</Button>);
  assert.match(html, /<button(?=[^>]*type="submit")(?=[^>]*form="meal-form")(?=[^>]*name="intent")(?=[^>]*value="update")(?=[^>]*disabled="")(?=[^>]*aria-label="Save Lunch")(?=[^>]*class="button primary footerAction")[^>]*>/);
});

test('square buttons can join a field without adding their own rounded corners', () => {
  const html = renderToStaticMarkup(<Button shape="square">Save</Button>);
  assert.match(html, /class="button primary square"/);
  assert.doesNotMatch(html, /shape=/);
});

test('button event handlers pass through to the native element', () => {
  const onClick = vi.fn();
  const button = Button({ children: 'Cancel', variant: 'secondary', onClick });
  assert.equal(button.type, 'button');
  assert.equal(button.props.onClick, onClick);
});

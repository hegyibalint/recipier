import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, test, vi } from 'vitest';
import { Button } from './button';
import { Editable } from './editable';

const state = vi.hoisted(() => ({ editing: false, setEditing: vi.fn() }));
vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useState: () => [state.editing, state.setEditing],
  useEffect: vi.fn(),
}));
beforeEach(() => { state.editing = false; vi.clearAllMocks(); });
const props = { value: 'Soup', label: 'Recipe title', name: 'title', children: createElement(Button, { type: 'submit', shape: 'square' }, 'Save') };

function render(disabled = false) {
  return renderToStaticMarkup(createElement(Editable, { ...props, disabled }));
}

test('Editable shows the label followed by a right pencil button', () => {
  const html = render();
  assert.match(html, /<button(?=[^>]*aria-label="Edit recipe title")(?=[^>]*class="button ghost icon")[^>]*>/);
  assert.match(html, /<svg[^>]*aria-hidden="true"/);
  assert.ok(html.indexOf('Soup') < html.indexOf('<button'));
  assert.doesNotMatch(html, /<input/);
  const tree = Editable(props);
  const button = tree.props.children[1];
  button.props.onClick();
  assert.deepEqual(state.setEditing.mock.calls, [[true]]);
});

test('editing replaces the label with a focused input and Save/Cancel controls', () => {
  state.editing = true;
  const html = render();
  assert.match(html, /<input(?=[^>]*aria-label="Recipe title")(?=[^>]*name="title")(?=[^>]*required="")(?=[^>]*autofocus="")(?=[^>]*value="Soup")/);
  assert.match(html, /<button(?=[^>]*type="submit")(?=[^>]*class="button primary square")[^>]*>Save<\/button>/);
  assert.match(html, /<button(?=[^>]*type="button")(?=[^>]*class="button secondary square")[^>]*>Cancel<\/button>/);
  assert.doesNotMatch(html, /<svg/);
  const tree = Editable(props);
  const preventDefault = vi.fn();
  tree.props.onKeyDown({ key: 'Escape', preventDefault });
  assert.equal(preventDefault.mock.calls.length, 1);
  assert.deepEqual(state.setEditing.mock.calls, [[false]]);
});

test('busy editors disable input and cancellation, including Escape', () => {
  state.editing = true;
  assert.match(render(true), /<input[^>]*disabled=""/);
  assert.match(render(true), /<button(?=[^>]*type="button")(?=[^>]*disabled="")[^>]*>Cancel/);
  const tree = Editable({ ...props, disabled: true });
  tree.props.onKeyDown({ key: 'Escape', preventDefault: vi.fn() });
  assert.equal(state.setEditing.mock.calls.length, 0);
});

import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, test, vi } from 'vitest';
import { Dialog } from './dialog';

const hooks = vi.hoisted(() => ({
  node: { open: false, showModal: vi.fn(), close: vi.fn() },
  effects: [] as (() => void)[],
}));
vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useId: () => 'dialog-test',
  useRef: (initial: unknown) => ({ current: initial === null ? hooks.node : initial }),
  useEffect: (effect: () => void) => { hooks.effects.push(effect); },
}));
beforeEach(() => {
  hooks.effects = [];
  hooks.node.open = false;
  vi.clearAllMocks();
  hooks.node.showModal.mockImplementation(() => { hooks.node.open = true; });
  hooks.node.close.mockImplementation(() => { hooks.node.open = false; });
});
const props = { open: false, title: 'Delete recipe?', onClose: vi.fn() };
function sync(open: boolean) {
  renderToStaticMarkup(<Dialog {...props} open={open} />);
  hooks.effects.pop()?.();
}

test('dialog labels itself with its visible title and optional description, without an SSR open attribute', () => {
  const html = renderToStaticMarkup(<Dialog {...props} open description="This cannot be undone."
    footer={<button type="button">Cancel</button>}><p>Recipe details</p></Dialog>);
  assert.match(html, /<dialog(?=[^>]*aria-labelledby="dialog-test-title")(?=[^>]*aria-describedby="dialog-test-description")[^>]*>/);
  assert.match(html, /<h2 id="dialog-test-title">Delete recipe\?<\/h2>/);
  assert.match(html, /<p id="dialog-test-description">This cannot be undone\.<\/p>/);
  assert.match(html, /<p>Recipe details<\/p>/);
  assert.match(html, /<div class="footer"><button type="button">Cancel<\/button><\/div>/);
  assert.doesNotMatch(html, /<header|<footer/);
  assert.match(html, /aria-label="Close dialog"/);
  assert.doesNotMatch(html, /\sopen(?:[\s=>])|tabindex=|aria-modal=/);
});

test('optional description and footer do not leave empty accessibility references or chrome', () => {
  const html = renderToStaticMarkup(<Dialog {...props}>Content</Dialog>);
  assert.doesNotMatch(html, /aria-describedby|class="footer"/);
});

test('controlled state uses showModal and close only when a native state transition is needed', () => {
  sync(false);
  assert.equal(hooks.node.showModal.mock.calls.length, 0);
  assert.equal(hooks.node.close.mock.calls.length, 0);
  sync(true);
  sync(true);
  assert.equal(hooks.node.showModal.mock.calls.length, 1);
  sync(false);
  sync(false);
  assert.equal(hooks.node.close.mock.calls.length, 1);
});

test('callers can choose safe initial focus after the dialog enters the top layer', () => {
  const focus = vi.fn();
  const initialFocusRef = { current: { focus } as unknown as HTMLButtonElement };
  renderToStaticMarkup(<Dialog {...props} open initialFocusRef={initialFocusRef} />);
  assert.equal(focus.mock.calls.length, 0);
  hooks.effects.pop()?.();
  assert.equal(hooks.node.showModal.mock.calls.length, 1);
  assert.deepEqual(focus.mock.calls, [[{ preventScroll: true }]]);
});

test('close controls use native close; only its event notifies the caller, avoiding duplicate callbacks', () => {
  const onClose = vi.fn();
  const tree = Dialog({ ...props, onClose });
  tree.props.onClose();
  const surface = tree.props.children;
  surface.props.children[0].props.children[1].props.onClick();
  const target = {};
  tree.props.onPointerDown({ target, currentTarget: target });
  tree.props.onClick({ target, currentTarget: target });
  assert.equal(hooks.node.close.mock.calls.length, 2);
  assert.equal(onClose.mock.calls.length, 1);
});

test('content clicks and drags starting in the content do not dismiss the dialog', () => {
  const onClose = vi.fn();
  const tree = Dialog({ ...props, onClose });
  const target = {};
  const content = {};
  tree.props.onPointerDown({ target: content, currentTarget: target });
  tree.props.onClick({ target: content, currentTarget: target });
  tree.props.onClick({ target, currentTarget: target });
  assert.equal(hooks.node.close.mock.calls.length, 0);
  assert.equal(onClose.mock.calls.length, 0);
});

import assert from 'node:assert/strict';
import { beforeEach, test, vi } from 'vitest';
import { renderWithRouter } from '../../tests/support/router';
import { ConfirmDelete } from './confirm-delete';

const state = vi.hoisted(() => ({ open: false, setOpen: vi.fn(), nextId: 0 }));
vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useId: () => `confirmation-${state.nextId++}`,
  useRef: (initial: unknown) => ({ current: initial }),
  useState: () => [state.open, state.setOpen],
}));
beforeEach(() => { state.open = false; state.nextId = 0; vi.clearAllMocks(); });
const props = { itemName: 'Lunch', children: 'Delete', fields: { id: 'meal-id' } };

test('the trigger only opens a confirmation; it is not a submit button', () => {
  const tree = ConfirmDelete(props);
  const [trigger, dialog] = tree.props.children;
  assert.equal(trigger.props.type, 'button');
  assert.equal(trigger.props['aria-haspopup'], 'dialog');
  assert.equal(dialog.props.open, false);
  trigger.props.onClick();
  assert.deepEqual(state.setOpen.mock.calls, [[true]]);
});

test('confirmation starts on Cancel and only the explicit destructive action submits the separate POST form', () => {
  state.open = true;
  const tree = ConfirmDelete({ ...props, actionLabel: 'Delete meal time' });
  const dialog = tree.props.children[1];
  const [cancel, confirm] = dialog.props.footer.props.children;
  const form = dialog.props.children[1];
  assert.equal(dialog.props.open, true);
  assert.equal(dialog.props.title, 'Delete “Lunch”?');
  assert.equal(dialog.props.initialFocusRef, cancel.props.ref);
  assert.equal(cancel.props.variant, 'secondary');
  assert.equal(confirm.props.variant, 'danger');
  assert.equal(confirm.props.type, 'submit');
  assert.equal(confirm.props.name, 'intent');
  assert.equal(confirm.props.value, 'delete');
  assert.equal(confirm.props.children, 'Delete meal time');
  assert.equal(confirm.props.form, form.props.id);
  assert.equal(form.props.method, 'post');
  assert.equal(form.props.replace, true);
  cancel.props.onClick();
  dialog.props.onClose();
  form.props.onSubmit();
  assert.deepEqual(state.setOpen.mock.calls, [[false], [false], [false]]);
});

test('hidden fields and accessible trigger names are retained, escaped, and independent of edit validation', () => {
  const html = renderWithRouter(<ConfirmDelete {...props} aria-label="Delete Lunch" className="deleteLink" />);
  assert.match(html, /<button(?=[^>]*class="deleteLink")(?=[^>]*aria-label="Delete Lunch")(?=[^>]*type="button")[^>]*>Delete<\/button>/);
  assert.match(html, /<input(?=[^>]*type="hidden")(?=[^>]*name="id")(?=[^>]*value="meal-id")[^>]*>/);
  assert.doesNotMatch(html, /required=|name="name"|name="starts_at"/);
  const unsafe = renderWithRouter(<ConfirmDelete itemName={'<img src=x onerror=alert(1)>'}>Delete</ConfirmDelete>);
  assert.match(unsafe, /&lt;img/);
  assert.doesNotMatch(unsafe, /<img/);
});

test('callers can explain the impact with an accessible description and rich detail content', () => {
  const html = renderWithRouter(<ConfirmDelete {...props}
    description="This mealtime is used by 3 planned meals."
    details={<p>Those meals will be removed. <strong>Your recipes will be kept.</strong></p>} />);
  assert.match(html, /id="[^"]+-description">This mealtime is used by 3 planned meals\.<\/p>/);
  assert.match(html, /Those meals will be removed\. <strong>Your recipes will be kept\.<\/strong>/);
  assert.doesNotMatch(html, /This will permanently delete it\./);
});

test('busy state disables both the trigger and the destructive submit', () => {
  const html = renderWithRouter(<ConfirmDelete {...props} disabled />);
  assert.match(html, /<button(?=[^>]*type="button")(?=[^>]*aria-haspopup="dialog")(?=[^>]*disabled="")[^>]*>/);
  assert.match(html, /<button(?=[^>]*type="submit")(?=[^>]*value="delete")(?=[^>]*disabled="")[^>]*>/);
});

test('multiple confirmations use distinct forms and correctly associated submit buttons', () => {
  const html = renderWithRouter(<>
    <ConfirmDelete itemName="Lunch">Delete</ConfirmDelete>
    <ConfirmDelete itemName="Dinner">Delete</ConfirmDelete>
  </>);
  const ids = [...html.matchAll(/<form[^>]*id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, 2);
  assert.equal(new Set(ids).size, 2);
  for (const id of ids) assert.ok(html.includes(`form="${id}"`));
});

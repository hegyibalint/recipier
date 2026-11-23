import assert from 'node:assert/strict';
import { test } from 'vitest';
import { parseTemplate } from './template.ts';

test('step references support quantities, Unicode units and backslash escaping', () => {
  assert.deepEqual(parseTemplate('Mix until smooth. Show \\${i:not-a-reference} literally.'), []);
  assert.deepEqual(parseTemplate('Add ${i:butter} and ${i:sugar:1e2:g}, then ${c:dumpling:4}.'), [
    { kind: 'i', id: 'butter' },
    { kind: 'i', id: 'sugar', amount: 100, amountText: '1e2', unit: 'g' },
    { kind: 'c', id: 'dumpling', amount: 4, amountText: '4' },
  ]);
  assert.equal(parseTemplate('${i:butter:0.5:cuillère à soupe}')[0].unit, 'cuillère à soupe');
});

test('backslash escaping suppresses only the reference opener', () => {
  for (const text of [
    '\\${i:missing}', '\\${c:missing:2}', '\\${not-a-reference}',
    '\\${i:missing', '\\\\${i:missing}',
  ]) assert.deepEqual(parseTemplate(text), [], text);

  assert.deepEqual(parseTemplate('Show \\${i:missing} and \\${c:missing}, then add ${i:butter:10:g}.'), [
    { kind: 'i', id: 'butter', amount: 10, amountText: '10', unit: 'g' },
  ]);
  assert.deepEqual(parseTemplate('C:\\recipes\\notes and \\text ${i:butter}'), [{ kind: 'i', id: 'butter' }]);
  assert.deepEqual(parseTemplate('$${i:butter}'), [{ kind: 'i', id: 'butter' }]);
  assert.throws(() => parseTemplate('$${not-a-reference}'), Error);
});

test('step parser rejects malformed references and non-positive JSON quantities', () => {
  for (const text of [
    '${i:butter', '${x:butter}', '${i:Butter}', '${i:butter:0:g}', '${i:butter:-1:g}',
    '${i:butter:1/2:g}', '${i:butter:1:}', '${i:butter:1:g:extra}', '${i:butter:g}',
    '${i:butter:01:g}', '${i:butter:+1:g}', '${i:butter:Infinity:g}', '${i:butter:1e999:g}',
    '${i:butter:1e-999:g}', '${i:butter:1\n:g}', '${i:butter\n}', '${i:butter::g}',
    '${i:butter:1:   }', '${i:butter: 1:g}', '${i:butter:1.:g}', '${i:${i:butter}}',
  ]) assert.throws(() => parseTemplate(text), Error, text);
});

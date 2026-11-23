import assert from 'node:assert/strict';
import { test } from 'vitest';
import { dateRangeSchema } from './schema.ts';

const range = { from: '2026-11-09', to: '2026-11-16' };

test('range contract requires real calendar dates and half-open increasing bounds', () => {
  for (const valid of [range, { from: '2028-02-29', to: '2028-03-01' }, { from: '0001-01-01', to: '9999-12-31' }]) {
    assert.deepEqual(dateRangeSchema.parse(valid), valid);
  }
  for (const invalid of [
    {}, { from: range.from }, { ...range, from: null }, { ...range, extra: true },
    { ...range, to: range.from }, { from: range.to, to: range.from },
    ...['2026-02-29', '2026-11-31', '2026-1-01', '0000-01-01', 'next week',
      '2026-11-09T00:00:00Z', '2026-11-09 ', 'infinity'].map(from => ({ ...range, from })),
  ]) assert.equal(dateRangeSchema.safeParse(invalid).success, false, JSON.stringify(invalid));
});

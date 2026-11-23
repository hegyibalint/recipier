import assert from 'node:assert/strict';
import { test } from 'vitest';
import { calendarWeek, localDate, shiftDate } from './calendar';

const today = '2026-11-06';

test('weeks run Monday through Sunday, including when the selected day is Sunday', () => {
  for (const date of ['2026-11-02', '2026-11-06', '2026-11-08']) {
    assert.deepEqual(calendarWeek(date, today), {
      start: '2026-11-02',
      days: ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'],
      previous: '2026-10-26', next: '2026-11-09',
    });
  }
});

test('missing or invalid week parameters fall back to the current local week', () => {
  for (const invalid of [null, '', 'tomorrow', '2026-02-29', '2026-13-01', '2026-1-01', '2026-11-06T00:00:00Z']) {
    assert.deepEqual(calendarWeek(invalid, today), calendarWeek(today, today));
  }
});

test('date-only arithmetic crosses month/year boundaries, leap days, and DST without drifting', () => {
  assert.deepEqual(calendarWeek('2027-01-01', today).days, [
    '2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03',
  ]);
  assert.equal(shiftDate('2028-02-28', 1), '2028-02-29');
  assert.equal(shiftDate('2028-02-28', 2), '2028-03-01');
  assert.equal(shiftDate('2026-03-08', 1), '2026-03-09');
  assert.equal(shiftDate('2026-10-25', 1), '2026-10-26');
  assert.equal(shiftDate('2026-11-01', 1), '2026-11-02');
});

test('today is read from local date parts rather than UTC ISO output', () => {
  assert.equal(localDate(new Date(2026, 10, 6, 23, 59)), today);
  assert.equal(localDate(new Date(2026, 10, 7, 0, 1)), '2026-11-07');
});

test('navigation does not produce partial weeks beyond supported calendar years', () => {
  assert.equal(calendarWeek('0001-01-01', today).previous, null);
  assert.equal(calendarWeek('9999-12-20', today).next, null);
  assert.deepEqual(calendarWeek('9999-12-31', today), calendarWeek(today, today));
});

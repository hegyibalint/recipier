import { calendarWeek, localDate, shiftDate } from '../../lib/planning/calendar';
import { dateSchema, shoppingRangeSchema } from '../../lib/planning/schema';

export type ShoppingMode = 'days' | 'next-week' | 'all' | 'linked';
const defaultDays = 7;
// No valid four-digit date range can span more than the whole supported calendar.
export const maxShoppingDays = 3_652_058;

export function shoppingSelection(params: URLSearchParams, today = localDate()) {
  const requestedMode = params.get('mode');
  // Planning and demo links can still open an explicit date range directly.
  const linked = requestedMode === null && (params.has('from') || params.has('through'));
  const mode: ShoppingMode = linked ? 'linked'
    : requestedMode === 'next-week' || requestedMode === 'all' ? requestedMode : 'days';
  const daysParam = params.get('days');
  const days = daysParam === null ? defaultDays : Number(daysParam);
  const validDays = (daysParam === null || /^\d+$/.test(daysParam)) && Number.isSafeInteger(days) && days >= 1 && days <= maxShoppingDays;
  const selection = { mode, days: validDays ? days : defaultDays };

  let from = today;
  let to: string | undefined;
  if (mode === 'linked') {
    const through = dateSchema.safeParse(params.get('through'));
    from = params.get('from') ?? '';
    to = through.success ? shiftDate(through.data, 1) : '';
  } else if (mode === 'next-week') {
    const currentMonday = calendarWeek(null, today).start;
    from = shiftDate(currentMonday, 7);
    to = shiftDate(currentMonday, 14);
  } else if (mode === 'days') {
    if (!validDays) return { selection, rangeError: 'Enter a valid whole number of days, starting at 1.' };
    to = shiftDate(today, days);
  }

  const range = shoppingRangeSchema.safeParse(to === undefined ? { from } : { from, to });
  return range.success
    ? { selection, range: range.data }
    : { selection, rangeError: 'This date range isn’t available. Choose a different shopping period.' };
}

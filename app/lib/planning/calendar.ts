import { dateSchema } from './schema';

// Today comes from the browser's local calendar, not UTC's potentially different day.
export function localDate(now = new Date()) {
  return `${now.getFullYear().toString().padStart(4, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Use UTC only for arithmetic on date-only values: DST must not shorten a day.
export function calendarDate(value: string) {
  return new Date(`${value}T12:00:00Z`);
}

export function shiftDate(value: string, days: number) {
  const date = calendarDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
}

function mondayOf(value: string) {
  return shiftDate(value, -((calendarDate(value).getUTCDay() + 6) % 7));
}

export function calendarWeek(value: string | null, today = localDate()) {
  const parsed = dateSchema.safeParse(value);
  let start = mondayOf(parsed.success ? parsed.data : today);
  // Do not render partial weeks outside the supported four-digit calendar years.
  if (!dateSchema.safeParse(start).success || !dateSchema.safeParse(shiftDate(start, 6)).success) {
    start = mondayOf(today);
  }
  const days = Array.from({ length: 7 }, (_, index) => shiftDate(start, index));
  const previous = shiftDate(start, -7);
  const next = shiftDate(start, 7);
  return {
    start,
    days,
    previous: dateSchema.safeParse(previous).success ? previous : null,
    next: dateSchema.safeParse(shiftDate(next, 6)).success ? next : null,
  };
}

export type CalendarWeek = ReturnType<typeof calendarWeek>;

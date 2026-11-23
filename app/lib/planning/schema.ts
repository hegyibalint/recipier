import { z } from 'zod';

export const dateSchema = z.iso.date().refine(value => value >= '0001-01-01', 'Expected a calendar date in years 0001–9999.');

export const dateRangeSchema = z.strictObject({
  from: dateSchema,
  to: dateSchema,
}).refine(value => value.from < value.to, {
  path: ['to'],
  message: 'Expected from < to (inclusive from, exclusive to).',
});

export type DateRange = z.infer<typeof dateRangeSchema>;

export const idSchema = z.uuid();
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:00)?$/, 'Expected HH:MM or HH:MM:00.')
  .transform(value => value.slice(0, 5));
const mealtimeFields = {
  name: z.string().refine(value => value.trim().length > 0, 'Name must not be blank.'),
  starts_at: timeSchema,
  ends_at: timeSchema,
};
const validWindow = (value: { starts_at?: string; ends_at?: string }) =>
  !value.starts_at || !value.ends_at || value.starts_at < value.ends_at;
const windowError = { path: ['ends_at'], message: 'Expected starts_at < ends_at within the same day.' };
const nonempty = (value: object) => Object.keys(value).length > 0;

export const createMealtimeSchema = z.strictObject(mealtimeFields).refine(validWindow, windowError);
export const updateMealtimeSchema = z.strictObject(mealtimeFields).partial()
  .refine(nonempty, 'Provide at least one field.').refine(validWindow, windowError);

const entryFields = {
  date: dateSchema,
  mealtime_id: idSchema,
  recipe_id: idSchema,
  multiplier: z.number().positive(),
};
export const createEntrySchema = z.strictObject({
  ...entryFields, multiplier: entryFields.multiplier.default(1),
});
export const updateEntrySchema = z.strictObject(entryFields).partial()
  .refine(nonempty, 'Provide at least one field.');

export type CreateMealtime = z.infer<typeof createMealtimeSchema>;
export type UpdateMealtime = z.infer<typeof updateMealtimeSchema>;
export type CreateEntry = z.infer<typeof createEntrySchema>;
export type UpdateEntry = z.infer<typeof updateEntrySchema>;

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
const nonempty = (value: object) => Object.keys(value).length > 0;

export const createMealtimeSchema = z.strictObject({
  name: z.string().trim().min(1, 'Name must not be blank.'),
});
export const updateMealtimeSchema = createMealtimeSchema;
export const reorderMealtimesSchema = z.strictObject({
  ids: z.array(idSchema).refine(ids => new Set(ids.map(id => id.toLowerCase())).size === ids.length, 'Meal time IDs must be unique.'),
});

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

import { z } from 'zod';
import { idSchema } from './schema';

export const extraIngredientLimits = { name: 200, description: 500, unit: 80, quantities: 20 };
const line = (max: number) => z.string().trim().min(1).max(max).regex(/^[^\r\n\x00]+$/);
const name = line(extraIngredientLimits.name);
const description = z.string().trim().min(1).max(extraIngredientLimits.description).regex(/^[^\x00]+$/);
const quantity = z.strictObject({
  amount: z.number().positive(),
  unit: line(extraIngredientLimits.unit).nullable(),
});
const quantities = z.array(quantity).max(extraIngredientLimits.quantities);

export const newExtraIngredientSchema = z.strictObject({
  name,
  original_name: name.optional(),
  description: description.optional(),
  quantities: quantities.optional().describe('Leave empty if no quantity was specified. Use null for a unitless amount.'),
});
export const extraIngredientIdSchema = z.strictObject({ id: idSchema });
export const updateExtraIngredientSchema = newExtraIngredientSchema.extend(extraIngredientIdSchema.shape);
export const extraIngredientSchema = z.object({
  id: idSchema, name, original_name: name.nullable(), description: description.nullable(), quantities,
});
export const extraIngredientsSchema = z.object({ items: z.array(extraIngredientSchema) });
export type NewExtraIngredient = z.infer<typeof newExtraIngredientSchema>;
export type ExtraIngredient = z.infer<typeof extraIngredientSchema>;

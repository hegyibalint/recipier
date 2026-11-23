import { z } from 'zod';

export const recipeSummarySchema = z.object({ recipe_id: z.uuid(), title: z.string(), subtitle: z.string() });
export type RecipeSummary = z.infer<typeof recipeSummarySchema>;
export type ListRecipes = () => Promise<RecipeSummary[]>;

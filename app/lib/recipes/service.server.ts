import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { recipeSchema } from './schema.ts';
import { parseRecipe } from './validate.ts';
import { recipeSummarySchema, type RecipeSummary } from './summary.ts';

const savedRow = z.object({ id: z.uuid(), created_at: z.iso.datetime({ offset: true }) });
export type SavedRecipe = { recipe_id: string; created_at: string; title: string };
export type SaveRecipe = (input: unknown) => Promise<SavedRecipe>;

export const recipeVersionSchema = z.int32().positive();
export const recipeSnapshotSchema = z.object({
  recipe_id: z.uuid(), version: recipeVersionSchema, recipe: recipeSchema,
});
const snapshotRow = z.object({ id: z.uuid(), version: recipeVersionSchema, document: recipeSchema });
const updateResult = z.union([
  recipeSnapshotSchema,
  z.object({ error: z.enum(['version_conflict', 'recipe_not_found']) }),
]);

// No transport concerns here. Ownership is supplied by the verified request
// context, never recipe arguments; the database also enforces ownership via RLS.
export function recipeService(database: SupabaseClient, userId: string) {
  return {
    async list(): Promise<RecipeSummary[]> {
      const recipes: RecipeSummary[] = [];
      const pageSize = 500;
      // Fetch only presentation fields, never full recipe documents. Range
      // requests avoid silently truncating collections at the Data API limit.
      for (;;) {
        const { data, error, count } = await database.from('recipes')
          .select('recipe_id:id,title:document->>title,subtitle:document->>subtitle', { count: 'exact' })
          .eq('user_id', userId)
          .order('created_at', { ascending: false }).order('id', { ascending: false })
          .range(recipes.length, recipes.length + pageSize - 1);
        if (error) throw new Error('Recipe listing failed.');
        const page = recipeSummarySchema.array().parse(data);
        recipes.push(...page);
        if (count !== null ? recipes.length >= count : page.length < pageSize) return recipes;
        if (page.length === 0) throw new Error('Recipe listing was incomplete.');
      }
    },
    async get(recipeId: string) {
      const { data, error } = await database.from('recipes')
        .select('id,version,document').eq('user_id', userId).eq('id', recipeId).maybeSingle();
      if (error) throw new Error('Recipe load failed.');
      if (data === null) return null;
      const row = snapshotRow.parse(data);
      return { recipe_id: row.id, version: row.version, recipe: row.document };
    },
    async update(recipeId: string, baseVersion: number, input: unknown) {
      const recipe = parseRecipe(input);
      const { data, error } = await database.rpc('update_recipe', {
        recipe_id: recipeId, base_version: baseVersion, recipe,
      });
      if (error) throw new Error('Recipe update failed.');
      return updateResult.parse(data);
    },
    async create(input: unknown): Promise<SavedRecipe> {
      const recipe = parseRecipe(input);
      const { data, error } = await database.from('recipes')
        .insert({ user_id: userId, document: recipe }).select('id,created_at').single();
      if (error) throw new Error('Recipe storage failed.');
      const row = savedRow.parse(data);
      return { recipe_id: row.id, created_at: row.created_at, title: recipe.title };
    },
  };
}

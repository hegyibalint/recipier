import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { ApiError } from '../api-error.server.ts';
import { parseRecipe } from '../recipes/validate.ts';
import { dateRangeSchema, idSchema, type CreateEntry, type CreateMealtime, type DateRange, type UpdateEntry, type UpdateMealtime } from './schema.ts';
import { ingredientsForRecipe } from './shopping-list.ts';

const mealtimeColumns = 'id,name,position,created_at';
const entryColumns = 'id,date,mealtime_id,recipe_id,multiplier,created_at';
const mealtimeUsageSchema = z.looseObject({
  planned_meals: z.array(z.object({ count: z.number().int().nonnegative() })).length(1),
});
const sourcesSchema = z.array(z.object({
  recipe_id: idSchema,
  multiplier: z.number().positive(),
  recipe: z.object({ document: z.unknown() }),
}));

type DatabaseError = { code?: string };
type Page = { data: unknown[] | null; count: number | null; error: DatabaseError | null };

// No HTTP or session handling here. Every operation retains both the caller's
// JWT/RLS and an explicit owner filter; callers cannot supply ownership fields.
export function planningService(database: SupabaseClient, userId: string) {
  const entries = (range: DateRange, columns = entryColumns) => database.from('meal_plan_entries')
    .select(columns, { count: 'exact' }).eq('user_id', userId)
    .gte('date', range.from).lt('date', range.to).order('date').order('id');

  return {
    listMealtimes: async () => {
      const rows = await allRows((start, end) => database.from('mealtimes')
        .select(`${mealtimeColumns},planned_meals:meal_plan_entries!meal_plan_entries_mealtime_owner_fkey(count)`, { count: 'exact' })
        .eq('user_id', userId).order('position').order('id').range(start, end));
      return rows.map(row => {
        const { planned_meals, ...mealtime } = mealtimeUsageSchema.parse(row);
        return { ...mealtime, planned_meals_count: planned_meals[0].count };
      });
    },

    createMealtime: (input: CreateMealtime) => changedRow(database.from('mealtimes')
      .insert({ ...input, user_id: userId }).select(mealtimeColumns).single()),

    updateMealtime: (id: string, input: UpdateMealtime) => changedRow(database.from('mealtimes')
      .update(input).eq('user_id', userId).eq('id', id).select(mealtimeColumns).maybeSingle()),

    reorderMealtimes: async (ids: string[]) => {
      const { error } = await database.rpc('reorder_mealtimes', { mealtime_ids: ids });
      if (error?.code === 'PT409') {
        throw new ApiError(409, 'mealtime_order_conflict', 'The meal time list has changed.');
      }
      checkError(error);
    },

    deleteMealtime: async (id: string) => {
      await changedRow(database.from('mealtimes').delete()
        .eq('user_id', userId).eq('id', id).select('id').maybeSingle());
    },

    listEntries: (range: DateRange) => {
      const bounds = dateRangeSchema.parse(range);
      return allRows((start, end) => entries(bounds).range(start, end));
    },

    createEntry: (input: CreateEntry) => changedRow(database.from('meal_plan_entries')
      .insert({ ...input, user_id: userId }).select(entryColumns).single()),

    updateEntry: (id: string, input: UpdateEntry) => changedRow(database.from('meal_plan_entries')
      .update(input).eq('user_id', userId).eq('id', id).select(entryColumns).maybeSingle()),

    deleteEntry: async (id: string) => {
      await changedRow(database.from('meal_plan_entries').delete()
        .eq('user_id', userId).eq('id', id).select('id').maybeSingle());
    },

    shoppingList: async (range: DateRange) => {
      // Load every planned recipe in the validated date range.
      const bounds = dateRangeSchema.parse(range);
      const rows = await allRows((start, end) => entries(
        bounds,
        'recipe_id,multiplier,recipe:recipes!meal_plan_entries_recipe_owner_fkey(document)',
      ).range(start, end));

      // Scale ingredient usages by the planned batch size.
      const items = sourcesSchema.parse(rows).flatMap(row => {
        const recipe = parseRecipe(row.recipe.document);
        const source = { id: row.recipe_id, title: recipe.title };
        return ingredientsForRecipe(recipe, row.multiplier).map(item => ({ ...item, source }));
      });
      return { items };
    },
  };
}

function checkError(error: DatabaseError | null) {
  if (!error) return;
  if (error.code === '23503' || error.code === '23505') {
    throw new ApiError(409, 'reference_conflict', 'A referenced resource is unavailable or still in use.');
  }
  if (['23514', '23502', '22007', '22008', '22P02'].includes(error.code ?? '')) {
    throw new ApiError(400, 'invalid_request', 'The values violate a data constraint.');
  }
  if (error.code === '42501') throw new ApiError(403, 'forbidden', 'This operation is not allowed.');
  throw new ApiError(502, 'storage_failed', 'Could not complete the database operation.');
}

async function allRows(query: (start: number, end: number) => PromiseLike<Page>): Promise<unknown[]> {
  const rows: unknown[] = [];
  while (true) {
    const { data, count, error } = await query(rows.length, rows.length + 499);
    checkError(error);
    if (!Array.isArray(data) || count === null || !Number.isSafeInteger(count)
      || count < rows.length + data.length || (!data.length && rows.length < count)) {
      throw new ApiError(502, 'incomplete_response', 'Could not load the complete result.');
    }
    rows.push(...data);
    if (rows.length >= count) return rows;
  }
}

async function changedRow(query: PromiseLike<{ data: unknown; error: DatabaseError | null }>) {
  const { data, error } = await query;
  checkError(error);
  if (!data) throw new ApiError(404, 'not_found', 'This resource is not available.');
  return data;
}

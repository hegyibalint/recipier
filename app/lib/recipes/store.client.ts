import { redirect } from 'react-router';
import { recipeSchema, type Recipe } from './schema.ts';
import { allowedUser, errorMessage } from '../auth/session.client';
import { supabase } from '../auth/supabase.client';

export type RecipeRow = { id: string; created_at: string; document: Recipe };
export const recipeLimit = 50;
const recipeIdPattern = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

type RecipeResult =
  | { recipe: RecipeRow; error?: never; notFound?: never }
  | { recipe: null; error: string; notFound?: never }
  | { recipe: null; notFound: true; error?: never };

export async function loadRecipe(id: string): Promise<RecipeResult | Response> {
  try {
    const user = await allowedUser();
    if (!user) return redirect('/auth/login');

    // Reject invalid UUIDs before querying Postgres. Missing and inaccessible rows
    // share the same not-found state, so other users' recipes are never disclosed.
    if (!recipeIdPattern.test(id)) {
      return { recipe: null, notFound: true };
    }

    const { data, error } = await supabase
      .from('recipes')
      .select('id, created_at, document')
      .eq('user_id', user.id)
      .eq('id', id)
      .maybeSingle();
    if (error) return { recipe: null, error: 'Could not load this recipe. Please try again.' };
    if (!data) return { recipe: null, notFound: true };
    return { recipe: { id: data.id, created_at: data.created_at, document: readDocument(data.document) } };
  } catch (error) {
    return { recipe: null, error: errorMessage(error) };
  }
}

export async function renameRecipe(id: string, value: unknown): Promise<{ error: string; savedTitle?: never } | { savedTitle: string; error?: never } | Response> {
  try {
    const user = await allowedUser();
    if (!user) return redirect('/auth/login');
    if (!recipeIdPattern.test(id)) return { error: 'This recipe isn’t available.' };
    if (typeof value !== 'string' || !value.trim()) return { error: 'Enter a recipe title.' };
    const title = value.trim();
    const { data, error } = await supabase.rpc('rename_recipe', { recipe_id: id, new_title: title });
    if (error) return { error: 'Could not save the title. Please try again.' };
    if (!data) return { error: 'This recipe isn’t available.' };
    return { savedTitle: title };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function deleteRecipe(id: string): Promise<{ error: string } | Response> {
  try {
    const user = await allowedUser();
    if (!user) return redirect('/auth/login');
    if (!recipeIdPattern.test(id)) return { error: 'This recipe isn’t available.' };

    const { data, error } = await supabase
      .from('recipes')
      .delete()
      .eq('user_id', user.id) // RLS also enforces ownership and browser-only deletion.
      .eq('id', id)
      .select('id')
      .maybeSingle();
    if (error) return { error: 'Could not delete this recipe. Please try again.' };
    if (!data) return { error: 'This recipe isn’t available. It may already have been deleted.' };
    return redirect('/');
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function loadRecipes() {
  try {
    const user = await allowedUser();
    if (!user) return redirect('/auth/login');

    const { data, error } = await supabase
      .from('recipes')
      .select('id, created_at, document')
      .eq('user_id', user.id) // Defense in depth; RLS remains the actual boundary.
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(recipeLimit);
    if (error) return { recipes: [], error: 'Could not load your recipes. Please try refreshing.' };
    const recipes: RecipeRow[] = (data ?? []).map(row => ({
      id: row.id,
      created_at: row.created_at,
      document: readDocument(row.document),
    }));
    return { recipes };
  } catch (error) {
    return { recipes: [], error: errorMessage(error) };
  }
}

function readDocument(document: unknown): Recipe {
  const result = recipeSchema.safeParse(document);
  if (!result.success) throw new Error('A saved recipe has an unsupported format.');
  return result.data;
}

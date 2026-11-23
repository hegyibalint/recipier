import { redirect } from 'react-router';
import { z } from 'zod';
import { allowedUser, errorMessage } from '../auth/session.client';
import { supabase } from '../auth/supabase.client';

const choiceSchema = z.object({ id: z.uuid(), title: z.string().trim().min(1), subtitle: z.string() });
export type RecipeChoice = z.infer<typeof choiceSchema>;

// A lightweight, complete picker catalogue, not the newest-50 full-document list.
export async function loadRecipeChoices(): Promise<{ recipes: RecipeChoice[]; error?: string } | Response> {
  try {
    const user = await allowedUser();
    if (!user) return redirect('/auth/login');
    const recipes: RecipeChoice[] = [];
    for (;;) {
      const { data, error, count } = await supabase.from('recipes')
        .select('id,title:document->>title,subtitle:document->>subtitle', { count: 'exact' })
        .eq('user_id', user.id).order('created_at', { ascending: false }).order('id', { ascending: false })
        .range(recipes.length, recipes.length + 499);
      if (error) throw new Error('Could not load your recipes. Please try again.');
      const page = choiceSchema.array().safeParse(data);
      if (!page.success || count === null || !Number.isSafeInteger(count)
        || count < recipes.length + page.data.length || (!page.data.length && recipes.length < count)) {
        throw new Error('Could not load the complete recipe list. Please try again.');
      }
      recipes.push(...page.data);
      if (recipes.length >= count) return { recipes };
    }
  } catch (error) {
    return { recipes: [], error: errorMessage(error) };
  }
}

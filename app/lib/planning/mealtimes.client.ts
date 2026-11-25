import { z } from 'zod';
import { errorMessage } from '../auth/session.client';
import { planningRequest } from './api.client';
import { createMealtimeSchema, idSchema, reorderMealtimesSchema } from './schema';

const mealtimeSchema = createMealtimeSchema.extend({
  id: idSchema, position: z.number().int().positive(), created_at: z.string(),
});
const mealtimeWithUsageSchema = mealtimeSchema.safeExtend({ planned_meals_count: z.number().int().nonnegative() });
export type Mealtime = z.infer<typeof mealtimeSchema>;
export type MealtimeWithUsage = z.infer<typeof mealtimeWithUsageSchema>;
export type MealtimeResult = { error?: string; message?: string };

const requestMealtimes = (path = '', init: RequestInit = {}) => planningRequest(`mealtimes${path}`, init);

export async function loadMealtimes(): Promise<{ mealtimes: MealtimeWithUsage[]; error?: string } | Response> {
  try {
    const response = await requestMealtimes();
    if (response.status === 302) return response;
    if (!response.ok) throw new Error('Could not load your meal times. Please try again.');
    const result = z.object({ mealtimes: z.array(mealtimeWithUsageSchema) }).safeParse(await response.json());
    if (!result.success) throw new Error('Could not read your saved meal times.');
    return result.data;
  } catch (error) {
    return { mealtimes: [], error: error instanceof TypeError
      ? 'Could not reach your meal times. Please try again.' : errorMessage(error) };
  }
}

export async function saveMealtime(id: string | null, input: unknown): Promise<MealtimeResult | Response> {
  const parsed = createMealtimeSchema.safeParse(input);
  if (!parsed.success) return { error: 'Enter a name for this meal time.' };
  if (id !== null && !idSchema.safeParse(id).success) return { error: 'This meal time isn’t available.' };
  try {
    const response = await requestMealtimes(id ? `/${id}` : '', {
      method: id ? 'PATCH' : 'POST', body: JSON.stringify(parsed.data),
    });
    if (response.status === 302) return response;
    if (response.status === 404) return { error: 'This meal time isn’t available. Refresh the page to see the current list.' };
    if (!response.ok) return { error: 'Could not save this meal time. Refresh the list before trying again.' };
    const saved = mealtimeSchema.safeParse(await response.json());
    if (!saved.success) return { error: 'Could not confirm the saved meal time. Refresh the list before trying again.' };
    return id ? { message: 'Meal time updated.' } : { message: 'Meal time added.' };
  } catch {
    return { error: 'Could not confirm the saved meal time. Refresh the list before trying again.' };
  }
}

export async function reorderMealtimes(ids: unknown[]): Promise<MealtimeResult | Response> {
  const parsed = reorderMealtimesSchema.safeParse({ ids });
  if (!parsed.success) return { error: 'This meal time order is invalid.' };
  const error = 'Could not save the meal time order. Please try again.';
  try {
    const response = await requestMealtimes('', { method: 'PATCH', body: JSON.stringify(parsed.data) });
    if (response.status === 302) return response;
    if (response.status === 409) return { error: 'The meal time list changed. Try again with the updated rows.' };
    return response.status === 204 ? { message: 'Meal time order updated.' } : { error };
  } catch {
    return { error };
  }
}

export async function deleteMealtime(id: string): Promise<MealtimeResult | Response> {
  if (!idSchema.safeParse(id).success) return { error: 'This meal time isn’t available.' };
  try {
    const response = await requestMealtimes(`/${id}`, { method: 'DELETE' });
    if (response.status === 302) return response;
    if (response.status === 404) return { error: 'This meal time isn’t available. Refresh the page to see the current list.' };
    if (response.status !== 204) return { error: 'Could not delete this meal time. Refresh the list before trying again.' };
    return { message: 'Meal time deleted.' };
  } catch {
    return { error: 'Could not confirm deletion. Refresh the list before trying again.' };
  }
}

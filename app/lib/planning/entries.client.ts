import { z } from 'zod';
import { planningRequest } from './api.client';
import { createEntrySchema, dateRangeSchema, idSchema, type DateRange } from './schema';

const entrySchema = createEntrySchema.safeExtend({ id: idSchema, created_at: z.string() });
export type PlanEntry = z.infer<typeof entrySchema>;
export type EntryResult = { error?: string };

export async function loadEntries(range: DateRange): Promise<{ entries: PlanEntry[]; error?: string } | Response> {
  try {
    const bounds = dateRangeSchema.parse(range);
    const response = await planningRequest(`meal-plan?${new URLSearchParams(bounds)}`);
    if (response.status === 302) return response;
    if (!response.ok) throw new Error();
    const result = z.object({ entries: z.array(entrySchema) }).safeParse(await response.json());
    if (!result.success || result.data.entries.some(entry => entry.date < bounds.from || entry.date >= bounds.to)) throw new Error();
    return result.data;
  } catch {
    return { entries: [], error: 'Could not load your planned recipes. Please try again.' };
  }
}

export async function addEntry(input: unknown): Promise<EntryResult | Response> {
  const parsed = createEntrySchema.safeParse(input);
  if (!parsed.success) return { error: 'Choose a recipe and a valid meal slot.' };
  try {
    const response = await planningRequest('meal-plan', { method: 'POST', body: JSON.stringify(parsed.data) });
    if (response.status === 302) return response;
    if (response.status === 409) return { error: 'The recipe or meal time is no longer available. Refresh the page.' };
    if (response.status !== 201 || !entrySchema.safeParse(await response.json()).success) throw new Error();
    return {};
  } catch {
    return { error: 'Could not confirm the assignment. Check the slot before adding it again.' };
  }
}

export async function removeEntry(id: string): Promise<EntryResult | Response> {
  if (!idSchema.safeParse(id).success) return { error: 'This planned recipe isn’t available.' };
  try {
    const response = await planningRequest(`meal-plan/${id}`, { method: 'DELETE' });
    if (response.status === 302) return response;
    if (response.status === 404) return { error: 'This planned recipe is no longer available. Refresh the page.' };
    if (response.status !== 204) throw new Error();
    return {};
  } catch {
    return { error: 'Could not confirm removal. Refresh the slot before trying again.' };
  }
}

import { planningRequest } from '../../lib/planning/api.client';
import { extraIngredientIdSchema, extraIngredientsSchema, newExtraIngredientSchema, updateExtraIngredientSchema } from '../../lib/planning/shopping-extras';

const endpoint = 'shopping-list-extras';

export async function loadExtras() {
  try {
    const response = await planningRequest(endpoint);
    if (response.status === 302) return response;
    if (!response.ok) throw new Error();
    return { extras: extraIngredientsSchema.parse(await response.json()).items };
  } catch {
    return { extrasError: 'Could not load your extra ingredients. Please try again.' };
  }
}

export type ExtrasActionResult = { error: string } | { message: string };
const changes = {
  add: { method: 'POST', verb: 'add', message: 'Ingredient added.' },
  edit: { method: 'PATCH', verb: 'save', message: 'Ingredient updated.' },
  delete: { method: 'DELETE', verb: 'remove', message: 'Ingredient removed.' },
};

export async function changeExtras(request: Request): Promise<ExtrasActionResult | Response> {
  if (request.method !== 'POST') return { error: 'Unknown action.' };
  const form = await request.formData().catch(() => null);
  const intent = form?.get('intent');
  if (!form || (intent !== 'add' && intent !== 'edit' && intent !== 'delete')) return { error: 'Unknown action.' };

  const payload = parseChange(intent, form);
  if (!payload.success) return { error: intent === 'delete' ? 'This extra ingredient isn’t available.'
    : 'Enter a name and use a positive number for each quantity.' };

  const { method, verb, message } = changes[intent];
  try {
    const response = await planningRequest(endpoint, { method, body: JSON.stringify(payload.data) });
    if (response.status === 302) return response;
    if (!response.ok) throw new Error();
    return { message };
  } catch {
    return { error: `Could not ${verb} the ingredient. Please try again.` };
  }
}

function parseChange(intent: keyof typeof changes, form: FormData) {
  const id = form.get('id');
  if (intent === 'delete') return extraIngredientIdSchema.safeParse({ id });

  const units = form.getAll('unit');
  const quantities = form.getAll('amount').map((amount, index) => ({
    amount: typeof amount === 'string' && amount.trim() ? Number(amount) : NaN,
    unit: optionalText(units[index]) ?? null,
  }));
  const ingredient = {
    name: form.get('name'),
    original_name: optionalText(form.get('original_name')),
    description: optionalText(form.get('description')),
    quantities,
  };
  return intent === 'add' ? newExtraIngredientSchema.safeParse(ingredient)
    : updateExtraIngredientSchema.safeParse({ ...ingredient, id });
}

function optionalText(value: FormDataEntryValue | null | undefined) {
  return typeof value === 'string' ? value.trim() || undefined : undefined;
}

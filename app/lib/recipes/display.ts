import type { Recipe } from './schema.ts';
import { parseTemplate } from './template.ts';

type StepPart = { text: string; kind?: 'i' | 'c' };

// Visit each component once; component references do not multiply its ingredients.
export function ingredientQuantities(recipe: Recipe): Map<string, string> {
  const totals = new Map<string, Map<string | undefined, number>>();
  for (const component of recipe.components) {
    for (const step of component.steps) {
      for (const [token] of step.text.matchAll(/\\\$\{|\$\{[^}]*\}/g)) {
        if (token === '\\${') continue;
        let reference;
        try {
          [reference] = parseTemplate(token);
        } catch {
          // Like stepParts, tolerate malformed references in display-only data.
          continue;
        }
        if (reference.kind !== 'i' || reference.amount === undefined) continue;
        let units = totals.get(reference.id);
        if (!units) totals.set(reference.id, units = new Map());
        units.set(reference.unit, (units.get(reference.unit) ?? 0) + reference.amount);
      }
    }
  }
  return new Map([...totals].map(([id, units]) => [id, [...units].map(([unit, amount]) => {
    // Avoid floating-point artifacts such as 0.1 + 0.2 = 0.30000000000000004.
    const quantity = String(Number(amount.toPrecision(15)));
    if (!unit) return quantity;
    const separator = /^(mg|g|kg|ml|cl|dl|l)$/.test(unit) ? '' : ' ';
    return `${quantity}${separator}${unit}`;
  }).join(' + ')]));
}

// Preserve reference boundaries for styling without ever generating HTML.
// Unknown/malformed references stay visible for diagnosis.
export function stepParts(text: string, recipe: Recipe): StepPart[] {
  const parts: StepPart[] = [];
  let offset = 0;
  for (const match of text.matchAll(/\\\$\{|\$\{[^}]*\}/g)) {
    if (match.index > offset) parts.push({ text: text.slice(offset, match.index) });
    const token = match[0];
    let part: StepPart = { text: token === '\\${' ? '${' : token };
    if (token !== '\\${') {
      try {
        const [reference] = parseTemplate(token);
        const name = reference.kind === 'i'
          ? recipe.ingredients.find(item => item.id === reference.id)?.name
          : recipe.components.find(item => item.id === reference.id);
        const label = typeof name === 'string' ? name : name?.title ?? name?.id;
        if (label) {
          part = { text: [reference.amountText, reference.unit, label].filter(Boolean).join(' '), kind: reference.kind };
        }
      } catch {
        // Leave malformed references as ordinary text.
      }
    }
    parts.push(part);
    offset = match.index + token.length;
  }
  if (offset < text.length) parts.push({ text: text.slice(offset) });
  return parts;
}

export function renderStep(text: string, recipe: Recipe): string {
  return stepParts(text, recipe).map(part => part.text).join('');
}

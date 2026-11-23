const idPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const amountPattern = /^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/;

export type Reference = {
  kind: 'i' | 'c';
  id: string;
  amount?: number;
  amountText?: string;
  unit?: string;
};

// A backslash before ${ escapes the opener; other backslashes are ordinary text.
export function parseTemplate(text: string): Reference[] {
  const references: Reference[] = [];
  for (let offset = 0; offset < text.length;) {
    if (text.startsWith('\\${', offset)) {
      offset += 3;
    } else if (text.startsWith('${', offset)) {
      const end = text.indexOf('}', offset + 2);
      if (end === -1) throw new Error('Reference is missing its closing brace.');
      references.push(parseReference(text.slice(offset + 2, end)));
      offset = end + 1;
    } else {
      offset++;
    }
  }
  return references;
}

function parseReference(value: string): Reference {
  const parts = value.split(':');
  if (parts.length < 2 || parts.length > 4) throw new Error('Expected ${kind:id[:amount[:unit]]}.');
  const [kind, id, amountText, unit] = parts;
  if (kind !== 'i' && kind !== 'c') throw new Error(`Unknown reference kind ${JSON.stringify(kind)}.`);
  if (!idPattern.test(id)) throw new Error(`Invalid reference ID ${JSON.stringify(id)}.`);

  const reference: Reference = { kind, id };
  if (parts.length === 2) return reference;
  const amount = Number(amountText);
  if (!amountPattern.test(amountText) || !Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Amount ${JSON.stringify(amountText)} must be a finite positive JSON number.`);
  }
  reference.amount = amount;
  reference.amountText = amountText;
  if (parts.length === 4) {
    if (!unit.trim()) throw new Error('Unit must not be empty.');
    reference.unit = unit;
  }
  return reference;
}

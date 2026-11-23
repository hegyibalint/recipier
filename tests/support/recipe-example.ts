import { readFileSync } from 'node:fs';
import type { Recipe } from '../../app/lib/recipes/schema.ts';

// Exercise the documented recipe rather than maintaining a separate JSON fixture.
const spec = readFileSync(new URL('../../specs/step-template.v1.md', import.meta.url), 'utf8');
const match = /^## Complete recipe example\r?\n[\s\S]*?^```json\r?\n([\s\S]*?)\r?\n```/m.exec(spec);
if (!match) throw new Error('The step-template spec must include a complete recipe example in a JSON code block.');

export const example: Recipe = JSON.parse(match[1]);

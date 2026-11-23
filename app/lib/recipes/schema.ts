import { z } from 'zod';
import { stepReferenceGuidance } from './step-reference-guidance.ts';

const idSchema = z.string().regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/);
const presentationTextSchema = z.string().min(1).regex(/\S/, 'Must contain non-whitespace text.');

export const yieldSchema = z.strictObject({
  amount: z.number().positive(),
  unit: z.string().min(1),
});

const ingredientSchema = z.strictObject({
  id: idSchema,
  name: z.string().min(1).describe(
    'Ingredient identity only, e.g. "garlic", not "garlic, minced". Do not include preparation state; describe it in step text outside the reference. Reuse the same ingredient ID for whole, minced, or otherwise prepared uses.',
  ),
});

const stepSchema = z.strictObject({
  text: z.string().min(1).meta({
    format: 'recipier-template-v1',
    description: stepReferenceGuidance,
  }),
});

export const componentSchema = z.strictObject({
  id: idSchema.describe('A stable identifier for this component, unique within the recipe.'),
  title: z.string().min(1).optional(),
  yield: yieldSchema.optional(),
  depends_on: z.array(idSchema).meta({
    uniqueItems: true,
    description: [
      'Unique IDs of components that must be completed before this component.',
      'Dependencies must exist, must not name this component, and must form an acyclic graph.',
      'Every component referenced in this component’s steps must appear here.',
    ].join('\n'),
  }).optional(),
  steps: z.array(stepSchema).min(1),
});

export const recipeSchema = z.strictObject({
  title: presentationTextSchema.describe(
    'The name of the dish only: short, familiar, and easy to scan, e.g. "Pulled Pork", "Chicken soup", or "Garlic butter". Keep words that identify the dish, but move flavor, equipment, method, and other variant details to the subtitle. Do not stack modifiers or add promotional labels such as "Precision", "Ultimate", or "Perfect". Use "Pulled Pork", not "Vinegar-Forward Precision Slow-Cooker Pulled Pork".',
  ),
  subtitle: presentationTextSchema.describe(
    'One short supporting line, usually 4–10 words, describing this version through its defining flavor, method, or a translation. It may repeat the dish name when that reads naturally, but must add useful context rather than merely restating the title. For title "Pulled Pork", use "Vinegar-forward slow-cooker pulled pork". Avoid promotional labels and unsupported claims.',
  ),
  description: presentationTextSchema.describe(
    'A short paragraph (1–3 sentences) describing flavor, texture, and useful context. Complement the title and subtitle rather than repeating them. Keep detailed instructions in component steps and do not invent facts.',
  ),
  yield: yieldSchema.optional(),
  ingredients: z.array(ingredientSchema).meta({
    uniqueItems: true,
    description: [
      'Recipe-wide ingredient definitions with unique IDs and unique names (ignoring case and surrounding whitespace).',
      'Declare ingredients once; ingredient usage, amounts, and units are specified by references in component steps.',
      'Do not put preparation state in ingredient names or IDs. Reuse one ingredient for whole, minced, or otherwise prepared uses; put the local state in step text outside the reference.',
    ].join('\n'),
  }),
  components: z.array(componentSchema).min(1)
    .describe(`Preparation components with unique IDs.
Each component contains one or more steps.`),
}).meta({
  $id: 'urn:recipier:schema:recipe:1',
  title: 'Recipe',
  description: 'The agent-friendly format of a recipe.',
});

export type Yield = z.infer<typeof yieldSchema>;
export type Component = z.infer<typeof componentSchema>;
export type Recipe = z.infer<typeof recipeSchema>;

// JSON Schema describes the shape; parseRecipe also checks template and graph semantics.
// uniqueItems metadata is enforced by the identity/dependency checks in parseRecipe.
// Spread to omit Zod's non-enumerable ~standard validator marker: MCP must receive
// plain JSON Schema so parseRecipe can return structural and semantic issues alike.
export const recipeJsonSchema: z.core.JSONSchema.JSONSchema = { ...z.toJSONSchema(recipeSchema, {
  target: 'draft-2020-12',
  io: 'input',
}) };

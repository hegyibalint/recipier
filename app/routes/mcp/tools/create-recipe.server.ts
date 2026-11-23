import type { McpServer } from 'mcp-lite';
import { z } from 'zod';
import { recipeJsonSchema } from '../../../lib/recipes/schema.ts';
import { RecipeValidationError, type Issue } from '../../../lib/recipes/validate.ts';
import type { SaveRecipe } from '../../../lib/recipes/service.server.ts';

const description = `Save a recipe to the user's Recipier collection.

Call this tool only when the user explicitly asks to save a recipe.
Use the recipe they have provided or agreed on in the conversation.
If no recipe is available, tell the user rather than inventing one to save.

Follow the input schema and its field descriptions.
Each successful call creates a new recipe; it does not update an existing one.
The server assigns the recipe ID and ownership.

Confirm the save only when the result reports \`saved: true\`.
Include a clickable link to the returned \`recipe_url\` so the user can view the saved recipe (sign-in required).
If validation fails, use the returned \`issues\` to correct the document before submitting it again.
If the save cannot be confirmed, do not automatically retry: the recipe may already have been saved.`;

type Result = { saved: boolean; recipe_id?: string; recipe_url?: string; title?: string; created_at?: string; issues?: Issue[] };

export function registerCreateRecipe(server: McpServer, save: SaveRecipe, frontendUrl: string) {
  server.tool('create_recipe', {
    title: 'Create a new recipe',
    description,
    inputSchema: recipeJsonSchema,
    outputSchema: z.object({
      saved: z.boolean(), recipe_id: z.string().optional(), title: z.string().optional(),
      recipe_url: z.url().optional().describe('Link to view the saved recipe in Recipier; requires sign-in.'),
      created_at: z.string().optional(),
      issues: z.array(z.object({ code: z.string(), path: z.string(), message: z.string() })).optional(),
    }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    _meta: { securitySchemes: [{ type: 'oauth2', scopes: [] }] },
    handler: (input: unknown) => createRecipe(input, save, frontendUrl),
  });
}

async function createRecipe(input: unknown, save: SaveRecipe, frontendUrl: string) {
  let result: Result;
  try {
    // Validation and persistence belong to the shared recipe service.
    const saved = await save(input);
    result = {
      saved: true, ...saved,
      recipe_url: frontendUrl + '/recipes/' + encodeURIComponent(saved.recipe_id),
    };
  } catch (error) {
    result = {
      saved: false,
      issues: error instanceof RecipeValidationError ? error.issues : [{
        code: 'storage_error', path: '',
        message: 'The save could not be confirmed. Do not automatically retry: an interrupted request may already have saved the recipe.',
      }],
    };
  }
  return {
    isError: !result.saved,
    content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    structuredContent: result,
  };
}

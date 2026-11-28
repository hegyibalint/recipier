import { McpServer } from 'mcp-lite';
import { z } from 'zod';
import type { planningService } from '../../../lib/planning/service.server.ts';
import type { recipeService } from '../../../lib/recipes/service.server.ts';
import { registerCreateRecipe } from './create-recipe.server.ts';
import { registerListRecipes } from './list-recipes.server.ts';
import { registerRecipeEditing } from './recipe-editing.server.ts';
import { registerShoppingList } from './shopping-list.server.ts';

export function createMcpServer({ recipes, planning, frontend }: {
  recipes: ReturnType<typeof recipeService>;
  planning: ReturnType<typeof planningService>;
  frontend: string;
}) {
  const server = new McpServer({
    name: 'recipier', version: '0.4.0',
    schemaAdapter: schema => z.toJSONSchema(schema as z.ZodType),
  });
  registerCreateRecipe(server, recipes.create, frontend);
  registerListRecipes(server, recipes.list);
  registerRecipeEditing(server, recipes);
  registerShoppingList(server, planning.shoppingList);
  return server;
}

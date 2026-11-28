import { apiRoute, jsonBody } from '../../lib/api.server';
import { extraIngredientIdSchema, newExtraIngredientSchema, updateExtraIngredientSchema } from '../../lib/planning/shopping-extras';

const handle = apiRoute({
  GET: async ({ planning }) => Response.json({ items: await planning.listShoppingExtras() }),
  POST: async ({ request, planning }) => Response.json(
    await planning.addShoppingExtra(await jsonBody(request, newExtraIngredientSchema)), { status: 201 },
  ),
  PATCH: async ({ request, planning }) => {
    const { id, ...ingredient } = await jsonBody(request, updateExtraIngredientSchema);
    return Response.json(await planning.updateShoppingExtra(id, ingredient));
  },
  DELETE: async ({ request, planning }) => {
    const { id } = await jsonBody(request, extraIngredientIdSchema);
    await planning.deleteShoppingExtra(id);
    return new Response(null, { status: 204 });
  },
});

export { handle as loader, handle as action };

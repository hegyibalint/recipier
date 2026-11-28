import { apiRoute, jsonBody } from '../../lib/api.server.ts';
import { shoppingRangeSchema } from '../../lib/planning/schema.ts';

const handle = apiRoute({
  POST: async ({ request, planning }) => Response.json(
    await planning.shoppingList(await jsonBody(request, shoppingRangeSchema)),
  ),
});

export { handle as loader, handle as action };

import { apiRoute, jsonBody } from '../../lib/api.server.ts';
import { dateRangeSchema } from '../../lib/planning/schema.ts';

const handle = apiRoute({
  POST: async ({ request, planning }) => Response.json(
    await planning.shoppingList(await jsonBody(request, dateRangeSchema)),
  ),
});

export { handle as loader, handle as action };

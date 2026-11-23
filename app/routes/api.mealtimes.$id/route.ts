import { apiRoute, jsonBody, resourceId } from '../../lib/api.server.ts';
import { updateMealtimeSchema } from '../../lib/planning/schema.ts';

const handle = apiRoute({
  PATCH: async ({ request, params, planning }) => Response.json(
    await planning.updateMealtime(resourceId(params.id), await jsonBody(request, updateMealtimeSchema)),
  ),
  DELETE: async ({ params, planning }) => {
    await planning.deleteMealtime(resourceId(params.id));
    return new Response(null, { status: 204 });
  },
});

export { handle as loader, handle as action };

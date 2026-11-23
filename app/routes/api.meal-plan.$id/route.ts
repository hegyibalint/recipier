import { apiRoute, jsonBody, resourceId } from '../../lib/api.server.ts';
import { updateEntrySchema } from '../../lib/planning/schema.ts';

const handle = apiRoute({
  PATCH: async ({ request, params, planning }) => Response.json(
    await planning.updateEntry(resourceId(params.id), await jsonBody(request, updateEntrySchema)),
  ),
  DELETE: async ({ params, planning }) => {
    await planning.deleteEntry(resourceId(params.id));
    return new Response(null, { status: 204 });
  },
});

export { handle as loader, handle as action };

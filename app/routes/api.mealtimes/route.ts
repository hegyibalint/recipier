import { apiRoute, jsonBody } from '../../lib/api.server.ts';
import { createMealtimeSchema, reorderMealtimesSchema } from '../../lib/planning/schema.ts';

const handle = apiRoute({
  GET: async ({ planning }) => Response.json({ mealtimes: await planning.listMealtimes() }),
  POST: async ({ request, planning }) => Response.json(
    await planning.createMealtime(await jsonBody(request, createMealtimeSchema)), { status: 201 },
  ),
  PATCH: async ({ request, planning }) => {
    const { ids } = await jsonBody(request, reorderMealtimesSchema);
    await planning.reorderMealtimes(ids);
    return new Response(null, { status: 204 });
  },
});

export { handle as loader, handle as action };

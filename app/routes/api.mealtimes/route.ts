import { apiRoute, jsonBody } from '../../lib/api.server.ts';
import { createMealtimeSchema } from '../../lib/planning/schema.ts';

const handle = apiRoute({
  GET: async ({ planning }) => Response.json({ mealtimes: await planning.listMealtimes() }),
  POST: async ({ request, planning }) => Response.json(
    await planning.createMealtime(await jsonBody(request, createMealtimeSchema)), { status: 201 },
  ),
});

export { handle as loader, handle as action };

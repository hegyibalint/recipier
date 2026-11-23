import { apiRoute, dateRange, jsonBody } from '../../lib/api.server.ts';
import { createEntrySchema } from '../../lib/planning/schema.ts';

const handle = apiRoute({
  GET: async ({ request, planning }) => Response.json({
    entries: await planning.listEntries(dateRange(request)),
  }),
  POST: async ({ request, planning }) => Response.json(
    await planning.createEntry(await jsonBody(request, createEntrySchema)), { status: 201 },
  ),
});

export { handle as loader, handle as action };

import { StreamableHttpTransport } from 'mcp-lite';
import type { LoaderFunctionArgs } from 'react-router';
import { userDatabase } from '../../lib/auth/database.server.ts';
import { mcpConfig } from '../../lib/config.server.ts';
import { mcpEndpoints } from '../../lib/mcp-endpoints.ts';
import { planningService } from '../../lib/planning/service.server.ts';
import { recipeService } from '../../lib/recipes/service.server.ts';
import { createMcpAuthenticator } from './auth.server.ts';
import { allowedOrigins, applyCors, checkCors } from './cors.ts';
import { createMcpServer } from './tools/registry.server.ts';

const noStore = 'private, no-store';

let endpoint: ReturnType<typeof configure> | undefined;

async function handle({ request }: LoaderFunctionArgs): Promise<Response> {
  try {
    endpoint ??= configure();
  } catch {
    return notConfigured();
  }

  const origin = request.headers.get('Origin');
  const response = await dispatch(request, origin, endpoint);

  response.headers.set('Cache-Control', noStore);
  applyCors(response.headers, origin);
  return request.method === 'HEAD' ? new Response(null, response) : response;
}

async function dispatch(
  request: Request,
  origin: string | null,
  { config, authenticate, frontend, metadata }: ReturnType<typeof configure>,
): Promise<Response> {
  // Reject disallowed origins and answer preflights before requiring credentials.
  const corsResponse = checkCors(request.method, origin);
  if (corsResponse) return corsResponse;

  // Require a configured endpoint and a bearer token for its allowed user and client.
  if (!config.userId || !config.clientId || !config.publishableKey) return notConfigured();
  const auth = await authenticate(request.headers.get('Authorization'));
  if (auth.kind === 'unauthorized') {
    return new Response('A valid MCP OAuth access token is required.', {
      status: 401, headers: { 'WWW-Authenticate': `Bearer resource_metadata="${metadata}"` },
    });
  }
  if (auth.kind === 'forbidden') {
    return new Response('This user or OAuth client is not allowed.', { status: 403 });
  }

  // Serve the MCP request with request-scoped resources and no session adapter.
  const database = userDatabase(config, auth.token);
  const server = createMcpServer({
    recipes: recipeService(database, auth.userId),
    planning: planningService(database, auth.userId),
    frontend,
  });
  return new StreamableHttpTransport({ allowedOrigins }).bind(server)(request);
}

function configure() {
  const config = mcpConfig();
  const { issuer, resource, frontend, metadata } = mcpEndpoints(config);
  const authenticate = createMcpAuthenticator({
    issuer, audience: resource, userId: config.userId, clientId: config.clientId,
  });
  return { config, authenticate, frontend, metadata };
}

function notConfigured() {
  return new Response('MCP is not configured.', {
    status: 503, headers: { 'Cache-Control': noStore },
  });
}

export { handle as loader, handle as action };

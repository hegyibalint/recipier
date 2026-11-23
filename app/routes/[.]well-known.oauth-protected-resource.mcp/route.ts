import type { LoaderFunctionArgs } from 'react-router';
import { mcpConfig } from '../../lib/config.server.ts';
import { mcpEndpoints } from '../../lib/mcp-endpoints.ts';

const allowedMethods = 'GET, HEAD, OPTIONS';
const headers = {
  'Cache-Control': 'private, no-store',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': allowedMethods,
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept',
};

// Public OAuth discovery: a configuration-backed JSON document, not MCP transport.
export function loader({ request }: LoaderFunctionArgs) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

  let response: Response;
  try {
    const { resource, issuer } = mcpEndpoints(mcpConfig());
    response = Response.json({
      resource,
      authorization_servers: [issuer],
      bearer_methods_supported: ['header'],
      scopes_supported: [],
    }, { headers });
  } catch {
    response = new Response('MCP discovery is not configured.', { status: 503, headers });
  }
  return request.method === 'HEAD' ? new Response(null, response) : response;
}

export function action() {
  return new Response('Method not allowed.', {
    status: 405, headers: { ...headers, Allow: allowedMethods },
  });
}

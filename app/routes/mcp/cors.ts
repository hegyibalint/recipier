export const allowedOrigins = ['https://chatgpt.com', 'https://chat.openai.com'];

function isAllowedOrigin(origin: string | null) {
  return !origin || allowedOrigins.includes(origin);
}

export function checkCors(method: string, origin: string | null): Response | null {
  if (!isAllowedOrigin(origin)) return new Response('This origin is not allowed.', { status: 403 });
  if (method !== 'OPTIONS') return null;

  return new Response(null, { status: 204, headers: {
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept, MCP-Protocol-Version, MCP-Session-Id, Last-Event-ID',
  } });
}

export function applyCors(headers: Headers, origin: string | null) {
  if (origin && isAllowedOrigin(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
  }
  headers.set('Access-Control-Expose-Headers', 'WWW-Authenticate, MCP-Protocol-Version');
}

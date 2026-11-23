import { userDatabase } from './auth/database.server.ts';
import type { LoaderFunctionArgs } from 'react-router';
import { z } from 'zod';
import { planningService } from './planning/service.server.ts';
import { dateRangeSchema, idSchema } from './planning/schema.ts';
import { ApiError } from './api-error.server.ts';
import { apiConfig } from './config.server.ts';

type ApiContext = Pick<LoaderFunctionArgs, 'request' | 'params'> & {
  planning: ReturnType<typeof planningService>;
};
type Handler = (context: ApiContext) => Response | Promise<Response>;

// Bearer sessions only during this migration step. Cookies are deliberately
// ignored until server-side browser authentication and CSRF protection land.
export function apiRoute(methods: Record<string, Handler>) {
  const allowed = Object.keys(methods).flatMap(method => method === 'GET' ? ['GET', 'HEAD'] : [method]).join(', ');
  return async ({ request, params }: LoaderFunctionArgs): Promise<Response> => {
    let response: Response;
    try {
      const method = request.method === 'HEAD' ? 'GET' : request.method;
      if (!Object.hasOwn(methods, method)) {
        response = new ApiError(405, 'method_not_allowed', 'This method is not supported.').response();
        response.headers.set('Allow', allowed);
      } else {
        response = await methods[method]({ request, params, planning: await session(request) });
      }
    } catch (error) {
      response = error instanceof ApiError ? error.response()
        : new ApiError(502, 'operation_failed', 'Could not complete this operation.').response();
    }
    response.headers.set('Cache-Control', 'private, no-store');
    if (response.status === 401) response.headers.set('WWW-Authenticate', 'Bearer');
    return request.method === 'HEAD' ? new Response(null, response) : response;
  };
}

export async function jsonBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new ApiError(415, 'unsupported_media_type', 'Expected application/json.');
  }
  let body: unknown;
  try { body = await request.json(); }
  catch { throw new ApiError(400, 'invalid_request', 'Expected a JSON body.'); }
  return validate(schema, body);
}

export function dateRange(request: Request) {
  const query = new URL(request.url).searchParams;
  if ([...query.keys()].some(key => query.getAll(key).length !== 1)) {
    throw new ApiError(400, 'invalid_request', 'Provide each date bound exactly once.');
  }
  return validate(dateRangeSchema, Object.fromEntries(query));
}

export const resourceId = (value: string | undefined) => validate(idSchema, value);

async function session(request: Request) {
  const config = apiConfig();
  if (!config.supabaseUrl || !config.publishableKey || !config.userId) {
    throw new ApiError(503, 'not_configured', 'The API is not configured.');
  }
  const authorization = request.headers.get('Authorization');
  const token = authorization?.match(/^Bearer ([^\s]+)$/i)?.[1];
  if (!token) throw new ApiError(401, 'invalid_session', 'An authenticated user session is required.');

  const database = userDatabase(config, token);
  let claims;
  try {
    const result = await database.auth.getClaims(token);
    if (result.error || !result.data) throw new Error('Invalid JWT.');
    claims = result.data.claims;
  } catch {
    throw new ApiError(401, 'invalid_session', 'Could not verify the user session.');
  }
  const now = Date.now() / 1000;
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (claims.iss !== config.supabaseUrl + '/auth/v1' || !audiences.includes('authenticated')
    || claims.role !== 'authenticated' || typeof claims.exp !== 'number' || claims.exp <= now
    || (claims.nbf != null && (typeof claims.nbf !== 'number' || claims.nbf > now)) || !claims.sub) {
    throw new ApiError(401, 'invalid_session', 'An authenticated user session is required.');
  }
  if (claims.sub !== config.userId || claims.client_id != null) {
    throw new ApiError(403, 'forbidden', 'This session is not allowed.');
  }
  return planningService(database, claims.sub);
}

function validate<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new ApiError(400, 'invalid_request', 'Request validation failed.',
    parsed.error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message })));
  return parsed.data;
}

import { createRemoteJWKSet, jwtVerify } from 'jose';

type AuthConfig = {
  issuer: string;
  audience: string;
  userId: string;
  clientId: string;
};

type Authentication =
  | { kind: 'authenticated'; token: string; userId: string }
  | { kind: 'unauthorized' }
  | { kind: 'forbidden' };

export function createMcpAuthenticator({ issuer, audience, userId, clientId }: AuthConfig) {
  // Cache public signing keys only. Verify credentials on every request.
  const keys = createRemoteJWKSet(new URL(issuer + '/.well-known/jwks.json'), { timeoutDuration: 10_000 });

  return async (authorization: string | null): Promise<Authentication> => {
    const token = authorization?.match(/^Bearer ([^\s]+)$/i)?.[1];
    if (!token) return { kind: 'unauthorized' };

    let claims;
    try {
      ({ payload: claims } = await jwtVerify(token, keys, {
        issuer, audience,
        algorithms: ['ES256', 'RS256'], requiredClaims: ['exp', 'sub'],
      }));
    } catch {
      return { kind: 'unauthorized' };
    }

    // jose accepts arrays containing the requested audience; MCP requires this exact audience.
    if (claims.aud !== audience || claims.role !== 'authenticated') return { kind: 'unauthorized' };
    if (claims.sub !== userId || claims.client_id !== clientId) return { kind: 'forbidden' };
    return { kind: 'authenticated', token, userId: claims.sub };
  };
}

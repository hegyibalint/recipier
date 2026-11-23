import { createRequestHandler, RouterContextProvider } from 'react-router';
import { nonceContext } from './lib/request-context';

const handleRequest = createRequestHandler(
  () => import('virtual:react-router/server-build'),
  import.meta.env.MODE,
);

export default {
  async fetch(request: Request) {
    // Give the renderer and the response policy the same per-request nonce.
    const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
    const context = new RouterContextProvider();
    context.set(nonceContext, nonce);

    const response = await handleRequest(request, context);

    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // SSR needs nonce-authorized inline scripts. Vite's dev tooling has its own scripts.
    if (import.meta.env.PROD) {
      response.headers.set('Content-Security-Policy', [
        "default-src 'none'",
        `script-src 'self' 'nonce-${nonce}'`,
        "style-src 'self'",
        "connect-src 'self' https://*.supabase.co",
        "base-uri 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
      ].join('; '));
    }
    return response;
  },
};

import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { dev } from '$app/environment';
import type { AppRouter } from './trpc';

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      // url is dependent on the environment
      // in dev, we use localhost
      // in prod, we use the public domain
      url: dev ? 'http://localhost:5173/api/trpc' : `https://example.com/api/trpc`
    })
  ]
});

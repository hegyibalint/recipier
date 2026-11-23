import { createClient } from '@supabase/supabase-js';

type Config = { supabaseUrl: string; publishableKey: string };

// A fresh client per caller: never persist/refresh sessions or retry writes.
// The public key identifies the app; the verified caller's JWT retains RLS.
export function userDatabase(config: Config, token: string, fetcher: typeof fetch = fetch) {
  return createClient(config.supabaseUrl, config.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    db: { retry: false },
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => fetcher(input, { ...init, signal: AbortSignal.timeout(10_000) }),
    },
  });
}

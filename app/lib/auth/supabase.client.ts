import { createClient } from '@supabase/supabase-js';

export const userId = import.meta.env.DEMO_USER_ID;
export const clientId = import.meta.env.MCP_CLIENT_ID;

// This module only runs in the browser. Its session is separate from ChatGPT's tokens.
export const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_PUBLISHABLE_KEY,
  { auth: { storage: sessionStorage, detectSessionInUrl: false } },
);

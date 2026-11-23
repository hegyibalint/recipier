import { redirect } from 'react-router';
import { allowedUser } from '../auth/session.client';
import { supabase } from '../auth/supabase.client';

export async function planningRequest(path: string, init: RequestInit = {}) {
  if (!await allowedUser()) return redirect('/auth/login');
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw new Error('Could not verify your session. Please try again.');
  if (!session) return redirect('/auth/login');

  // Keep browser writes behind the verified JWT API. Never retry a write: a lost
  // response may still have committed it. Each caller validates its response.
  const response = await fetch(`/api/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });
  return response.status === 401 ? redirect('/auth/login') : response;
}

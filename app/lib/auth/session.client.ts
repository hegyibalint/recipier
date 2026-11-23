import { isAuthSessionMissingError } from '@supabase/supabase-js';
import { supabase, userId } from './supabase.client';

let localLogin: Promise<void> | undefined;

export async function allowedUser() {
  if (!userId) throw new Error('Set DEMO_USER_ID, then rebuild this app.');
  await ensureLocalLogin();

  // A missing session means signed out; verification failures are errors.
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error && !isAuthSessionMissingError(error)) {
    throw new Error('Could not verify your session. Please try again.');
  }

  if (user && user.id !== userId) {
    await supabase.auth.signOut({ scope: 'local' });
    throw new Error('This account is not allowed.');
  }
  return user;
}

export async function signIn(form: FormData) {
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get('email') ?? '').trim(),
    password: String(form.get('password') ?? ''),
  });
  if (error) throw new Error('Sign-in failed. Check your credentials.');

  // Reject other application accounts before reporting a successful login.
  if (!await allowedUser()) throw new Error('Could not verify your session. Please try again.');
}

export async function signOut() {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw new Error('Could not sign out.');
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

async function ensureLocalLogin() {
  if (!import.meta.env.LOCAL_DEV_LOGIN) return;

  // Concurrent session checks share a single local sign-in attempt.
  localLogin ??= (async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return;

    const { error } = await supabase.auth.signInWithPassword(JSON.parse(import.meta.env.LOCAL_DEV_LOGIN));
    if (error) throw new Error('Local auto-login failed. Restart npm run dev:local.');
  })();

  try {
    await localLogin;
  } finally {
    localLogin = undefined;
  }
}

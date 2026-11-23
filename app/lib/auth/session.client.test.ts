import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { allowedUser } from './session.client';
import { supabase } from './supabase.client';

vi.mock('./supabase.client', () => ({
  userId: 'local-user',
  clientId: '',
  supabase: { auth: {
    getSession: vi.fn(), getUser: vi.fn(), signInWithPassword: vi.fn(), signOut: vi.fn(),
  } },
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('LOCAL_DEV_LOGIN', '');
  vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'local-user' } }, error: null } as never);
});
afterEach(() => vi.unstubAllEnvs());

const credentials = { email: 'dev@recipier.test', password: 'local-only' };

test('normal mode does not attempt automatic login', async () => {
  await allowedUser();
  expect(supabase.auth.getSession).not.toHaveBeenCalled();
  expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
});

test('local mode signs in with a real session and still verifies the user', async () => {
  vi.stubEnv('LOCAL_DEV_LOGIN', JSON.stringify(credentials));
  vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });
  vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ error: null } as never);
  expect((await allowedUser())?.id).toBe('local-user');
  expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith(credentials);
  expect(supabase.auth.getUser).toHaveBeenCalledOnce();
});

test('local mode reuses an existing session', async () => {
  vi.stubEnv('LOCAL_DEV_LOGIN', JSON.stringify(credentials));
  vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: {} }, error: null } as never);
  await allowedUser();
  expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
});

test('local login failures are reported and can be retried', async () => {
  vi.stubEnv('LOCAL_DEV_LOGIN', JSON.stringify(credentials));
  vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });
  vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({ error: new Error('offline') } as never)
    .mockResolvedValueOnce({ error: null } as never);
  await expect(allowedUser()).rejects.toThrow('Local auto-login failed');
  await expect(allowedUser()).resolves.toHaveProperty('id', 'local-user');
});

test('local auto-login does not bypass the allowed account check', async () => {
  vi.stubEnv('LOCAL_DEV_LOGIN', JSON.stringify(credentials));
  vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: {} }, error: null } as never);
  vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'other' } }, error: null } as never);
  await expect(allowedUser()).rejects.toThrow('This account is not allowed');
  expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
});

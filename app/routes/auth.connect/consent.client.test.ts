import { beforeEach, expect, test, vi } from 'vitest';
import { allowedUser } from '../../lib/auth/session.client';
import { supabase } from '../../lib/auth/supabase.client';
import { submitConsent } from './consent.client';

vi.mock('../../lib/auth/session.client', async importOriginal => ({
  ...await importOriginal<typeof import('../../lib/auth/session.client')>(),
  allowedUser: vi.fn(),
}));

vi.mock('../../lib/auth/supabase.client', () => ({
  userId: 'owner',
  clientId: 'chatgpt',
  supabase: { auth: { oauth: {
    getAuthorizationDetails: vi.fn(),
    approveAuthorization: vi.fn(),
    denyAuthorization: vi.fn(),
    revokeGrant: vi.fn(),
  } } },
}));

const oauth = supabase.auth.oauth;
const callback = 'https://chatgpt.com/callback';
const details = { user: { id: 'owner' }, client: { id: 'chatgpt', name: 'ChatGPT' }, redirect_uri: callback };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(allowedUser).mockResolvedValue({ id: 'owner' } as never);
  vi.mocked(oauth.getAuthorizationDetails).mockResolvedValue({ data: details, error: null } as never);
});

function submit(intent: string) {
  const form = new FormData();
  form.set('intent', intent);
  return submitConsent(form, '?authorization_id=request-1');
}

test.each(['approve', 'deny'] as const)('%s rechecks the request before following the provider callback', async intent => {
  const decide = vi.mocked(intent === 'approve' ? oauth.approveAuthorization : oauth.denyAuthorization);
  decide.mockResolvedValue({ data: { redirect_url: callback }, error: null });

  const result = await submit(intent);

  expect(oauth.getAuthorizationDetails).toHaveBeenCalledBefore(decide);
  expect(decide).toHaveBeenCalledWith('request-1', { skipBrowserRedirect: true });
  expect(result).toBeInstanceOf(Response);
  expect((result as Response).headers.get('Location')).toBe(callback);
});

test('a mismatched client cannot be approved', async () => {
  vi.mocked(oauth.getAuthorizationDetails).mockResolvedValue({
    data: { ...details, client: { id: 'other' } }, error: null,
  } as never);

  await expect(submit('approve')).resolves.toEqual({ error: 'This user or OAuth client is not allowed.' });
  expect(oauth.approveAuthorization).not.toHaveBeenCalled();
});

test('revocation failures are returned as action data', async () => {
  vi.mocked(oauth.revokeGrant).mockRejectedValue(new Error('Offline'));

  await expect(submit('revoke')).resolves.toEqual({ error: 'Offline' });
  expect(oauth.revokeGrant).toHaveBeenCalledWith('chatgpt');
});

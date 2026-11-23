import { expect, test, vi } from 'vitest';
import { clientAction } from './route';
import { errorMessage, signOut } from '../../lib/auth/session.client';
import type { Route } from './+types/route';

vi.mock('../../lib/auth/session.client', () => ({
  signOut: vi.fn(),
  errorMessage: vi.fn(() => 'Could not sign out.'),
}));

const args = (method: string) => ({
  request: new Request('http://localhost/auth/logout', { method }),
}) as Route.ClientActionArgs;

test('sign-out clears the browser session and redirects to login', async () => {
  vi.mocked(signOut).mockResolvedValueOnce();
  const result = await clientAction(args('POST'));
  expect(signOut).toHaveBeenCalled();
  expect(result).toBeInstanceOf(Response);
  expect((result as Response).headers.get('Location')).toBe('/auth/login');
});

test('failed sign-out reports an error instead of claiming success', async () => {
  vi.mocked(signOut).mockRejectedValueOnce(new Error('Offline'));
  expect(await clientAction(args('POST'))).toEqual({ error: 'Could not sign out.' });
  expect(errorMessage).toHaveBeenCalled();
});

test('GET never signs the user out', async () => {
  vi.mocked(signOut).mockClear();
  expect(await clientAction(args('GET'))).toEqual({ error: 'Unknown action.' });
  expect(signOut).not.toHaveBeenCalled();
});

import assert from 'node:assert/strict';
import { test } from 'vitest';
import { authorizationId, callbackUrl, checkConsent } from './consent.ts';

test('preserves only a valid authorization identifier', () => {
  assert.equal(authorizationId('?authorization_id=abc-123&next=https://evil.example'), 'abc-123');
  assert.equal(authorizationId(''), null);
  for (const search of ['?authorization_id=', '?authorization_id=%0aevil', '?authorization_id=https://evil.example']) {
    assert.throws(() => authorizationId(search));
  }
});

test('consent is restricted to the configured user and client', () => {
  const details = { user: { id: 'owner' }, client: { id: 'chatgpt' } };
  assert.doesNotThrow(() => checkConsent(details, 'owner', 'chatgpt'));
  for (const [user, client] of [['other', 'chatgpt'], ['owner', 'other'], ['', '']]) {
    assert.throws(() => checkConsent(details, user, client));
  }
});

test('provider redirects allow HTTPS or the desktop HTTP loopback, without credentials', () => {
  assert.equal(callbackUrl('https://chatgpt.com/callback?code=opaque'), 'https://chatgpt.com/callback?code=opaque');
  const desktop = 'http://127.0.0.1:43219/callback/PPH-T8l_945e?code=opaque&state=opaque';
  assert.equal(callbackUrl(desktop), desktop);
  for (const value of [
    'javascript:alert(1)', 'http://evil.example', '//evil.example',
    'https://user:pass@example.com', 'http://user:pass@127.0.0.1:43219/callback',
    'http://127.0.0.1.evil.example/callback', 'http://127.0.0.2/callback',
  ]) {
    assert.throws(() => callbackUrl(value));
  }
});

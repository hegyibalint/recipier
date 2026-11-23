export function authorizationId(search: string) {
  const id = new URLSearchParams(search).get('authorization_id');
  if (id !== null && !/^[a-zA-Z0-9_-]{1,200}$/.test(id)) {
    throw new Error('Invalid authorization request. Start again from ChatGPT.');
  }
  return id;
}

export function checkConsent(
  details: { client: { id: string }; user: { id: string } },
  userId: string,
  clientId: string,
) {
  if (!userId || !clientId || details.user.id !== userId || details.client.id !== clientId) {
    throw new Error('This user or OAuth client is not allowed.');
  }
}

export function callbackUrl(value: string) {
  // Only follow URLs returned by Supabase, never a callback from the page query.
  const url = new URL(value);
  // Native OAuth clients use a local HTTP listener instead of an HTTPS callback.
  const loopback = url.protocol === 'http:' && url.hostname === '127.0.0.1';
  if ((url.protocol !== 'https:' && !loopback) || url.username || url.password) {
    throw new Error('Supabase returned an invalid callback URL.');
  }
  return url.href;
}

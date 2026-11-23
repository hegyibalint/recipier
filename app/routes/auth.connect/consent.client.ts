import { redirectDocument } from 'react-router';
import { authorizationId, callbackUrl, checkConsent } from '../../lib/auth/consent';
import { allowedUser, errorMessage, signOut } from '../../lib/auth/session.client';
import { clientId, supabase, userId } from '../../lib/auth/supabase.client';

type ConsentPage = {
  signedIn: boolean;
  error?: string;
  authorization?: { id: string; clientName: string; scope: string; redirectUri: string };
};

type ActionResult = { error?: string; message?: string; revoked?: boolean };

export async function loadConsentPage(search: string): Promise<ConsentPage | Response> {
  let signedIn = false;
  try {
    // Resolve the browser session before looking up the OAuth request.
    if (!userId || !clientId) {
      throw new Error('Set DEMO_USER_ID and MCP_CLIENT_ID, then rebuild this app.');
    }
    const id = authorizationId(search);
    if (!await allowedUser()) return { signedIn };

    signedIn = true;
    if (!id) return { signedIn };

    // Load the provider's request or resume a flow it has already resolved.
    const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(id);
    if (error || !data) {
      const reason = error?.code ?? error?.status ?? 'empty_response';
      throw new Error(`Cannot load authorization (${reason}). Start a new connection from ChatGPT.`);
    }
    if ('redirect_url' in data) return redirectDocument(callbackUrl(data.redirect_url));

    // Only show consent details for the configured user and client.
    checkConsent(data, userId, clientId);
    return {
      signedIn,
      authorization: {
        id,
        clientName: data.client.name,
        scope: data.scope || '(none)',
        redirectUri: data.redirect_uri,
      },
    };
  } catch (error) {
    return { signedIn, error: errorMessage(error) };
  }
}

export async function submitConsent(form: FormData, search: string): Promise<ActionResult | Response> {
  const intent = form.get('intent');
  try {
    switch (intent) {
      case 'approve':
      case 'deny':
        return await decideConsent(intent, search);
      case 'logout':
        await signOut();
        return {};
      case 'revoke':
        return await revokeConsent();
      default:
        throw new Error('Unknown action.');
    }
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

async function decideConsent(intent: 'approve' | 'deny', search: string) {
  // Recheck the user and request immediately before making a consent decision.
  const page = await loadConsentPage(search);
  if (page instanceof Response) return page;
  if (!page.authorization) throw new Error(page.error ?? 'Start a new connection from ChatGPT.');

  // Keep control of the redirect so we can validate the provider's callback.
  const { id } = page.authorization;
  const options = { skipBrowserRedirect: true };
  const { data, error } = intent === 'approve'
    ? await supabase.auth.oauth.approveAuthorization(id, options)
    : await supabase.auth.oauth.denyAuthorization(id, options);
  if (error || !data) throw new Error('Could not complete consent. Start again from ChatGPT.');

  return redirectDocument(callbackUrl(data.redirect_url));
}

async function revokeConsent(): Promise<ActionResult> {
  if (!await allowedUser()) throw new Error('Sign in before revoking access.');

  const { error } = await supabase.auth.oauth.revokeGrant(clientId);
  if (error) throw new Error('Could not revoke access.');

  return {
    revoked: true,
    message: 'Access revoked. Existing access tokens can remain valid until expiry.',
  };
}

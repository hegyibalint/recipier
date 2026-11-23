import { Form, Link, redirect, useNavigation } from 'react-router';
import type { Route } from './+types/route';
import { loadConsentPage, submitConsent } from './consent.client';
import styles from './styles.module.css';

// Auth remains browser-only; the server renders a loading shell, never a session.
export function meta() {
  return [{ title: 'ChatGPT access · Recipier' }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const search = new URL(request.url).search;
  const page = await loadConsentPage(search);
  if (!(page instanceof Response) && !page.signedIn && !page.error) {
    return redirect('/auth/login' + search);
  }
  return page;
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  return submitConsent(await request.formData(), new URL(request.url).search);
}

export function HydrateFallback() {
  return <><Introduction /><p role="status">Loading…</p></>;
}

function Introduction() {
  return (
    <>
      <h1>Connect ChatGPT</h1>
      <p>Save structured recipes from ChatGPT with <code>create_recipe</code>.</p>
    </>
  );
}

export default function Connect({ loaderData, actionData }: Route.ComponentProps) {
  const busy = useNavigation().state !== 'idle';
  const authorization = actionData?.revoked ? undefined : loaderData.authorization;
  const status = actionData?.error ?? actionData?.message ?? loaderData.error
    ?? (loaderData.signedIn && !authorization
      ? 'Signed in. Start the connection from ChatGPT to request consent.' : '');

  return (
    <>
      <p><Link to="/">← My recipes</Link></p>
      <Introduction />
      <p id="status" className={styles.status} role="status">{busy ? 'Working…' : status}</p>
      <fieldset disabled={busy}>
        {!loaderData.signedIn && (
          <p><Link to="/auth/login">Sign in to Recipier</Link></p>
        )}

        {authorization && (
          <section id="consent">
            <h2>Authorize {authorization.clientName}</h2>
            <p>This client can create recipes in your account.
              It cannot edit or delete existing recipes.</p>
            <p>Requested identity scopes: <code>{authorization.scope}</code></p>
            <p>Registered callback: <code>{authorization.redirectUri}</code></p>
            <p>The requested scopes may also expose identity information through Supabase.</p>
            <Form method="post" replace>
              <button name="intent" value="approve">Approve</button>
              <button name="intent" value="deny">Deny</button>
            </Form>
          </section>
        )}

        {loaderData.signedIn && (
          <section id="account" className={styles.account}>
            <Form method="post" replace>
              <button name="intent" value="logout">Sign out</button>
              <button name="intent" value="revoke">Revoke ChatGPT access</button>
            </Form>
            <p>Sign-out does not revoke ChatGPT access. Revocation stops future access-token renewal;
              an issued token can remain valid until it expires.</p>
          </section>
        )}
      </fieldset>
    </>
  );
}

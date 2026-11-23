import { Form, redirect, useNavigation } from 'react-router';
import { allowedUser, errorMessage, signIn } from '../../lib/auth/session.client';
import { authorizationId } from '../../lib/auth/consent';
import type { Route } from './+types/route';
import styles from './styles.module.css';

export function meta() {
  return [{ title: 'Sign in · Recipier Invite-Only Beta' }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  try {
    const next = destination(request.url);
    if (await allowedUser()) return redirect(next);
    return {};
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  try {
    const next = destination(request.url);
    await signIn(await request.formData());
    return redirect(next);
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

function Introduction() {
  return (
    <header>
      <p className={styles.betaBadge}>Invite-only beta</p>
      <h1>Your recipes, in one place.</h1>
      <p>Recipier is only available by invitation. Sign in to see the recipes you’ve saved from ChatGPT.</p>
    </header>
  );
}

export function HydrateFallback() {
  return (
    <section className={styles.panel}>
      <Introduction />
      <p role="status">Checking your session…</p>
    </section>
  );
}

export default function Login({ loaderData, actionData }: Route.ComponentProps) {
  const busy = useNavigation().state !== 'idle';
  const error = actionData?.error ?? loaderData.error;
  return (
    <section className={styles.panel}>
      <Introduction />
      {error && <p role="alert">{error}</p>}
      <Form method="post" replace aria-busy={busy}>
        <fieldset disabled={busy}>
          <label>Email
            <input name="email" type="email" autoComplete="username" required autoFocus />
          </label>
          <label>Password
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button type="submit">{busy ? 'Signing in…' : 'Sign in'}</button>
        </fieldset>
      </Form>
    </section>
  );
}

function destination(url: string) {
  const id = authorizationId(new URL(url).search);
  return id ? '/auth/connect?authorization_id=' + encodeURIComponent(id) : '/';
}

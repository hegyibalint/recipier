import { Form, redirect, useNavigation } from 'react-router';
import { allowedUser, errorMessage, signIn } from '../../lib/auth/session.client';
import { authorizationId } from '../../lib/auth/consent';
import type { Route } from './+types/route';
import styles from './styles.module.css';

export function meta() {
  return [{ title: 'Sign in · Recipier' }];
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

export function HydrateFallback() {
  return <p role="status">Checking your session…</p>;
}

export default function Login({ loaderData, actionData }: Route.ComponentProps) {
  const busy = useNavigation().state !== 'idle';
  const error = actionData?.error ?? loaderData.error;
  return (
    <section className={styles.panel}>
      <p className="eyebrow">Recipier</p>
      <h1>Your recipes, in one place.</h1>
      <p>Sign in to see the recipes you’ve saved from ChatGPT.</p>
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
      <p className="muted">Use your existing Recipier application account. Signup isn’t available yet.</p>
    </section>
  );
}

function destination(url: string) {
  const id = authorizationId(new URL(url).search);
  return id ? '/auth/connect?authorization_id=' + encodeURIComponent(id) : '/';
}

import { Link, redirect } from 'react-router';
import { errorMessage, signOut } from '../../lib/auth/session.client';
import type { Route } from './+types/route';

export async function clientAction({ request }: Route.ClientActionArgs) {
  if (request.method !== 'POST') return { error: 'Unknown action.' };
  try {
    await signOut();
    return redirect('/auth/login');
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export default function Logout({ actionData }: Route.ComponentProps) {
  return (
    <>
      <h1>Sign out</h1>
      <p role="alert">{actionData?.error ?? 'Use Sign out from the application navigation.'}</p>
      <Link to="/">Return to your recipes</Link>
    </>
  );
}

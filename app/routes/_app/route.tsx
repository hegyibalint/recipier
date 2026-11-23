import { Outlet, redirect, useMatches } from 'react-router';
import { AppShell } from '../../components/app-shell';
import { allowedUser } from '../../lib/auth/session.client';

export const handle = { layout: 'full-width' };

export async function clientLoader() {
  if (!await allowedUser()) return redirect('/auth/login');
  return {};
}

export function HydrateFallback() {
  return <AppShell loading><p role="status">Loading…</p></AppShell>;
}

export default function Workspace() {
  const wide = useMatches().some(match =>
    (match.handle as { contentWidth?: string } | undefined)?.contentWidth === 'wide',
  );
  return <AppShell wide={wide}><Outlet /></AppShell>;
}

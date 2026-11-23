import type { ReactNode } from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, isRouteErrorResponse, useMatches } from 'react-router';
import type { Route } from './+types/root';
import './brand.css';
import './style.css';
import styles from './root.module.css';

export function meta() {
  return [{ title: 'Recipier' }];
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="referrer" content="no-referrer" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const fullWidth = useMatches().some(match =>
    (match.handle as { layout?: string } | undefined)?.layout === 'full-width',
  );
  return fullWidth ? <Outlet /> : <main className={styles.main}><Outlet /></main>;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <main className={styles.main}>
      <h1>Recipier</h1>
      <p role="alert">
        {isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : 'Something went wrong.'}
      </p>
      <a href="/">Return to Recipier</a>
    </main>
  );
}

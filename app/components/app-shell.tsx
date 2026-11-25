import type { ReactNode } from 'react';
import { Form, Link, useLocation, useNavigation } from 'react-router';
import { RecipeSearch } from './recipe-search';
import styles from './app-shell.module.css';

const destinations = [
  { to: '/', label: 'Recipes' },
  { to: '/planning', label: 'Planning' },
  { to: '/shopping-list', label: 'Shopping list' },
];

export function AppShell({ children, loading = false, wide = false }: {
  children: ReactNode;
  loading?: boolean;
  wide?: boolean;
}) {
  const busy = useNavigation().state !== 'idle' || loading;
  const { pathname } = useLocation();
  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main-content">Skip to content</a>
      <header className={styles.header}>
        <Link className={styles.brand} to="/">Recipier</Link>
        <div className={styles.headerActions}>
          <RecipeSearch />
          <SignOut disabled={busy} />
        </div>
      </header>
      <div className={styles.workspace}>
        <aside className={styles.sidebar}>
          <nav className={styles.navigation} aria-label="Primary">
            {destinations.map(({ to, label }) => {
              const active = pathname === to || (to === '/' ? pathname.startsWith('/recipes/') : pathname.startsWith(`${to}/`));
              return (
                <Link key={to} to={to} className={styles.destination}
                  aria-current={active ? (pathname === to ? 'page' : 'location') : undefined}>
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className={styles.main} id="main-content" tabIndex={-1}>
          <div className={`${styles.content} ${wide ? styles.wide : ''}`}>{children}</div>
        </main>
      </div>
    </div>
  );
}

function SignOut({ disabled }: { disabled: boolean }) {
  return (
    <Form action="/auth/logout" method="post" replace>
      <button className={styles.signOut} disabled={disabled}>Sign out</button>
    </Form>
  );
}

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { test } from 'vitest';
import { fileURLToPath } from 'node:url';

test('official filesystem routing preserves every page/API URL and ignores colocated styles', () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const routes = JSON.parse(execFileSync(process.execPath, [
    resolve(root, 'node_modules/@react-router/dev/bin.cjs'), 'routes', '--json',
  ], { cwd: root, encoding: 'utf8' }));
  const paths: Record<string, string> = {};
  type Route = { id: string; path?: string; file: string; children?: Route[] };
  function collect(entries: Route[], prefix = '') {
    for (const entry of entries) {
      const path = [prefix, entry.path].filter(Boolean).join('/');
      if (entry.id !== 'root' && (entry.path || !entry.children)) paths['/' + path] = entry.file;
      collect(entry.children ?? [], path);
    }
  }
  collect(routes);
  const workspace = routes[0].children.find((route: Route) => route.file === 'routes/_app/route.tsx');
  assert.ok(workspace, 'A pathless workspace layout owns the application pages');
  assert.equal(workspace.children.length, 6);
  assert.deepEqual(paths, {
    '/': 'routes/_app._index/route.tsx',
    '/meals': 'routes/_app.meals/route.tsx',
    '/planning': 'routes/_app.planning/route.tsx',
    '/planning/:date/:mealtimeId': 'routes/_app.planning_.$date.$mealtimeId/route.tsx',
    '/shopping-list': 'routes/_app.shopping-list/route.tsx',
    '/auth/logout': 'routes/auth.logout/route.tsx',
    '/auth/login': 'routes/auth.login/route.tsx',
    '/auth/connect': 'routes/auth.connect/route.tsx',
    '/recipes/:recipeId': 'routes/_app.recipes.$recipeId/route.tsx',
    '/api/mealtimes': 'routes/api.mealtimes/route.ts',
    '/api/mealtimes/:id': 'routes/api.mealtimes.$id/route.ts',
    '/api/meal-plan': 'routes/api.meal-plan/route.ts',
    '/api/meal-plan/:id': 'routes/api.meal-plan.$id/route.ts',
    '/api/shopping-list': 'routes/api.shopping-list/route.ts',
    '/mcp': 'routes/mcp/route.ts',
    '/.well-known/oauth-protected-resource/mcp': 'routes/[.]well-known.oauth-protected-resource.mcp/route.ts',
  });
});

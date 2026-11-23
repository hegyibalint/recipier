import { cloudflare } from '@cloudflare/vite-plugin';
import { reactRouter } from '@react-router/dev/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const project = new URL(env.SUPABASE_URL || '');
  const localDevelopment = command === 'serve' && mode === 'sandbox';
  if (localDevelopment) {
    if (env.SUPABASE_URL !== 'http://127.0.0.1:54321') {
      throw new Error('Local development must use http://127.0.0.1:54321. Run npm run dev:local.');
    }
  } else if (project.protocol !== 'https:' || project.origin !== env.SUPABASE_URL) {
    throw new Error('SUPABASE_URL must be an HTTPS project origin.');
  }
  if (!env.SUPABASE_PUBLISHABLE_KEY?.startsWith('sb_publishable_')) {
    throw new Error('Set a modern SUPABASE_PUBLISHABLE_KEY in .env. Never use a secret/service-role key.');
  }

  if (env.MCP_RESOURCE_URL) {
    const resource = new URL(env.MCP_RESOURCE_URL);
    if (resource.protocol !== 'https:' || env.MCP_RESOURCE_URL !== resource.origin + '/mcp') {
      throw new Error('MCP_RESOURCE_URL must be an HTTPS application URL ending in /mcp.');
    }
  }

  // Expose exactly these public values, not every variable sharing their prefixes.
  const publicSettings = ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'DEMO_USER_ID', 'MCP_CLIENT_ID'];
  return {
    cacheDir: '.cache/vite',
    // Let resource routes handle preflight; Vite otherwise answers OPTIONS first.
    server: { cors: false },
    preview: { cors: false },
    plugins: [cloudflare({ viteEnvironment: { name: 'ssr' } }), reactRouter()],
    envPrefix: [],
    define: {
      ...Object.fromEntries(publicSettings.map(name => [
        `import.meta.env.${name}`, JSON.stringify(env[name] ?? ''),
      ])),
      // Only the exact local sandbox dev server can expose disposable login credentials.
      'import.meta.env.LOCAL_DEV_LOGIN': JSON.stringify(localDevelopment ? env.LOCAL_DEV_LOGIN ?? '' : ''),
    },
    environments: {
      ssr: { define: { 'import.meta.env.MCP_RESOURCE_URL': JSON.stringify(env.MCP_RESOURCE_URL ?? '') } },
    },
  };
});

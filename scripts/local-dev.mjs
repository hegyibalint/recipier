import { execFileSync, spawn } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';
import { createClient } from '@supabase/supabase-js';
import { recipeSchema } from '../app/lib/recipes/schema.ts';
import { localUser, localRecipes, localRecipeId, localMealtimes, localPlan } from './local-data.ts';

// Never load .env here: local credentials must come from the local CLI, not a
// linked project or a developer's hosted settings. Privileged keys stay in Node.
const manualAuth = process.argv.includes('--auth');
const port = manualAuth ? '5175' : '5174';
const env = { ...process.env };

// If no Docker host is configured, try Docker before falling back to Podman.
if (!env.DOCKER_HOST) {
  try {
    execFileSync('docker', ['info'], { stdio: 'ignore' });
  } catch {
    try {
      const socket = execFileSync('podman', ['machine', 'inspect', '--format', '{{.ConnectionInfo.PodmanSocket.Path}}'], { encoding: 'utf8' }).trim();
      env.DOCKER_HOST = `unix://${socket}`;
    } catch {
      throw new Error('Start Docker or a Podman machine before running npm run dev:local.');
    }
  }
}

// Bring the local stack up to date before looking up its credentials.
const cli = new URL('../node_modules/.bin/supabase', import.meta.url).pathname;
const excluded = 'studio,imgproxy,mailpit,realtime,storage-api,edge-runtime,logflare,vector,supavisor';
execFileSync(cli, ['start', '-x', excluded], { env, stdio: ['ignore', 'ignore', 'inherit'] });
// Existing stacks also need migrations added since their first startup.
execFileSync(cli, ['migration', 'up', '--local'], { env, stdio: 'inherit' });

// Verify the local endpoint before using its privileged key to seed data.
const status = JSON.parse(execFileSync(cli, ['status', '-o', 'json'], {
  env,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit'],
}));
if (status.API_URL !== 'http://127.0.0.1:54321') {
  throw new Error('Refusing to seed: expected the local Supabase API at http://127.0.0.1:54321.');
}
if (!status.PUBLISHABLE_KEY?.startsWith('sb_publishable_') || !status.SERVICE_ROLE_KEY) {
  throw new Error('Local Supabase did not report the required keys.');
}

const admin = createClient(status.API_URL, status.SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const existing = await admin.auth.admin.getUserById(localUser.id);
if (existing.error && existing.error.status !== 404) throw existing.error;
if (!existing.data.user) {
  checked(await admin.auth.admin.createUser({ ...localUser, email_confirm: true }));
}

// Refresh only fixture IDs, and avoid creating recipe revisions on unchanged restarts.
const ids = localRecipes.map((_, index) => localRecipeId(index));
const saved = checked(await admin.from('recipes').select('id,document').eq('user_id', localUser.id).in('id', ids));
const documents = new Map(saved.map(({ id, document }) => [id, document]));
const recipes = localRecipes.map((document, index) => ({
  id: ids[index],
  user_id: localUser.id,
  document: recipeSchema.parse(document),
}));
const changed = recipes.filter(({ id, document }) => !isDeepStrictEqual(documents.get(id), document));
if (changed.length) checked(await admin.from('recipes').upsert(changed, { onConflict: 'id,user_id' }));

checked(await admin.from('mealtimes').upsert(localMealtimes.map(mealtime => ({
  ...mealtime, user_id: localUser.id,
})), { onConflict: 'id', ignoreDuplicates: true }));

// Reuse existing assignments for these same recipe/slot pairs, including earlier demos.
const plan = localPlan();
const planned = checked(await admin.from('meal_plan_entries').select('date,mealtime_id,recipe_id')
  .eq('user_id', localUser.id).gte('date', plan.from).lte('date', plan.through)
  .in('recipe_id', plan.entries.map(entry => entry.recipe_id)));
const assignments = plan.entries.filter(entry => !planned.some(row =>
  row.date === entry.date && row.mealtime_id === entry.mealtime_id && row.recipe_id === entry.recipe_id));
for (const entry of assignments) {
  // Scope updates to the fixture owner before moving a previous week's sample.
  const updated = checked(await admin.from('meal_plan_entries').update(entry)
    .eq('id', entry.id).eq('user_id', localUser.id).select('id').maybeSingle());
  if (!updated) checked(await admin.from('meal_plan_entries').insert({ ...entry, user_id: localUser.id }));
}

console.log(`\nLocal development: http://127.0.0.1:${port}\n${manualAuth ? 'Manual login' : 'Automatic local login'}\nEmail: ${localUser.email}\nPassword: ${localUser.password}\nShopping example: http://127.0.0.1:${port}/shopping-list?from=${plan.from}&through=${plan.through}\n`);
const app = spawn('npm', ['run', 'dev', '--', '--mode', 'sandbox', '--port', port, '--strictPort'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    SUPABASE_URL: status.API_URL,
    SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY,
    DEMO_USER_ID: localUser.id,
    LOCAL_DEV_LOGIN: manualAuth ? '' : JSON.stringify({ email: localUser.email, password: localUser.password }),
    // Hosted OAuth consent/MCP are deliberately not configured in this mode.
    MCP_CLIENT_ID: '',
    MCP_RESOURCE_URL: '',
  },
});

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => app.kill(signal));
app.on('error', error => { console.error(error); process.exitCode = 1; });
app.on('exit', code => { process.exitCode = code ?? 0; });

function checked(result) {
  if (result.error) throw result.error;
  return result.data;
}

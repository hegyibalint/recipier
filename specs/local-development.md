# Local development with sample data

Run the real app, Supabase Auth, and Postgres locally, without hosted credentials
or an authentication bypass. Requires Node 24+ and Docker or Podman.

```sh
npm ci
# Start Docker, or on macOS with an existing Podman machine:
podman machine start
npm run dev:local
```

The first run downloads container images and applies the database migrations.
The command uses the pinned Supabase CLI from `package.json`, detects Docker or
Podman's macOS socket (or respects `DOCKER_HOST`), and starts only the services
needed for auth and database access. Every startup applies pending local migrations
before seeding, including when the database is already running.

- App (auto-login): `npm run dev:local` → <http://127.0.0.1:5174>
- App (login page): `npm run dev:local:auth` → <http://127.0.0.1:5175>
- Supabase API: <http://127.0.0.1:54321>
- Postgres: `127.0.0.1:55432`
- Email: `dev@recipier.test`
- Password: `recipier-local-only`

The default server automatically signs in with the disposable local credentials,
including after sign-out. Use `dev:local:auth` to test the normal login and logout
flow. Both modes use real Supabase sessions and RLS, not an authentication bypass.
The separate ports keep browser sessions isolated; both share the same local data.
Auto-login credentials are exposed only in the sandbox dev server, never in builds
or the hosted development mode.

The fixtures include Lemon pasta, Chickpea bowls, Pancakes, Garlic butter,
Chilled tofu, Crispy tofu, Mapo tofu, and Home-style tofu, plus Breakfast and
Dinner mealtimes. Chickpea bowls exercises multiple components and dependencies.
Startup plans the tofu recipes, Pancakes, and Lemon pasta for the current weekend
and prints a shopping-list link. Expand Soft tofu (650 g) to see the Chilled tofu
and Mapo tofu contributions. Firm and hard tofu stay separate, as do generic and
Chinese light soy sauce. Fermented chili bean paste (豆瓣酱) shows the original
packaging name. Butter still shows 3 tbsp + 50 g. Remove a recipe's assignments before deleting it in the UI.

## Isolation and persistence

`scripts/local-dev.mjs` reads keys from the running **local** CLI stack and refuses
to seed any API other than `http://127.0.0.1:54321`. Its privileged key is used
only in the Node seeding process; the app gets the publishable key and real user
sessions, with the normal RLS policies. It does not modify `.env` or use the
linked hosted project's credentials.

Fixtures live in `scripts/local-data.ts`. Edit them and restart `npm run dev:local`
to see the updated scenario. Startup refreshes fixture recipe documents by stable
ID, so edits to those sample documents are overwritten. It leaves recipes you
create separately untouched. It restores missing sample mealtimes, and moves its
own sample assignments to the current weekend without duplicating assignments
already in the same slots. Fixture IDs are separate from the pgTAP test fixtures,
so `supabase test db` can run against the seeded database.
The Vitest fixture tests validate recipe schemas, references, and dependencies.

The app uses Vite's `sandbox` mode. HTTP Supabase is accepted only for the exact
local API URL in this dev-server mode; production builds still require HTTPS.
`npm run dev` is unchanged and continues to use your `.env` settings.
ChatGPT consent and MCP OAuth are **not configured** by `dev:local`; this setup
is for recipe browsing and meal planning, not hosted ChatGPT integration.

## Stop, migrate, or reset

Ctrl+C stops the app; Supabase containers and local data remain available.
For CLI commands with Podman on macOS, set its socket in your terminal first:

```sh
export DOCKER_HOST="unix://$(podman machine inspect --format '{{.ConnectionInfo.PodmanSocket.Path}}')"
# Apply newly added migrations to an already-running local database:
npx supabase migration up --local
# Run database tests:
npx supabase test db
# Stop Supabase while preserving data:
npx supabase stop
```

To start over, stop the app, run `npx supabase db reset --local` (destroys local
app data), then run `npm run dev:local` to recreate the user and sample rows.
This reset is required once for local databases created before the consolidated
`20261107120000_initial_schema.sql` baseline; `migration up` cannot upgrade the
old history to the baseline. See [database setup](database.md) for fresh
hosted installations. The automatic SQL seeder remains disabled so CI can validate
migrations against an empty database. Never run a linked/hosted reset for this
local development workflow.

# Deploy the Worker with GitHub Actions

The **Deploy Worker** workflow runs manually from `main`. It first runs the
same CI checks on the selected commit: application type checks, tests, and a
build, plus migrations and tests against a fresh local database. Both jobs must
pass before the production job can start. That job builds with production
settings, dry-runs the Cloudflare package, deploys it, and smoke-tests the web
app and MCP discovery. Pull requests and normal pushes run CI only.

## Configure the production environment

In **Settings → Environments**, create `production` and restrict deployments to
`main`. Add a required reviewer if available. Set these environment variables:

| Variable | Value |
| --- | --- |
| `FRONTEND_URL` | Canonical HTTPS Worker origin, without a trailing slash |
| `CLOUDFLARE_ACCOUNT_ID` | Account that owns the Worker |
| `SUPABASE_URL` | HTTPS origin of your Supabase project |
| `SUPABASE_PUBLISHABLE_KEY` | Project's `sb_publishable_…` browser key |
| `DEMO_USER_ID` | UUID of the allowed application user |
| `MCP_CLIENT_ID` | UUID of the registered public OAuth client |

Add `CLOUDFLARE_API_TOKEN` as an **environment secret**, using a token scoped to
Worker deployments in that account. Do not commit it. This workflow does not
require a Supabase access token or database password.

## Before the first run

- Set up the database and [MCP OAuth configuration](mcp.md#self-hosted-mcp-setup)
  separately. For an existing service, verify its schema, OAuth client, and token
  audience already match the Worker settings. The public migrations contain
  fixture OAuth identifiers; do not apply them as-is to the existing production
  database or reset it as part of the cutover.
- If another repository or Git integration deploys this Worker, disable that
  deployment trigger before running this workflow. A GitHub concurrency group
  does not coordinate runs across repositories.
- In **Actions → Deploy Worker**, select `main` and run the workflow. After the
  anonymous checks pass, verify real sign-in and an authenticated MCP request.

# Database setup

Use a fresh Supabase project for self-hosting. The migrations in
`supabase/migrations/` define the recipe schema, planning tables, access rules,
and OAuth hook. Do not apply this baseline over an existing Recipier database
without a separately reviewed migration plan.

For local development, use [the local setup](local-development.md). To run just
the database tests, start Docker and run:

```sh
npx supabase db start
npx supabase test db
```

For a fresh hosted project, install the project dependencies, authenticate the
Supabase CLI, and link the project you intend to use:

```sh
npx supabase link --project-ref <your-project-ref>
npx supabase db push --linked --dry-run
npx supabase db push --linked
```

Review the dry run before applying it. Create an application user in Supabase
Auth and set `DEMO_USER_ID` to that user's UUID. For ChatGPT integration, configure
your own client and resource as described in [MCP setup](mcp.md#self-hosted-mcp-setup).

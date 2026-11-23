# Recipier

Recipier is an AI-first recipe and ingredient system. It can be used to:

- **Save recipes from ChatGPT.** Keep ingredients, quantities, and preparation
  steps together in a recipe you can come back to.
- **Browse your recipes.** Search by name or description and open a recipe to
  see its ingredients and steps.
- **Plan your week.** Set up mealtimes like breakfast or dinner, then assign
  recipes to them on the calendar.

## MCP

Connect ChatGPT through the
[Model Context Protocol](https://modelcontextprotocol.io/specification/latest)
to list, read, save, and update your recipes. Meal planning is in the web app;
shopping-list generation is available through the HTTP API.

## Try it locally

With Node.js 24+ and Docker or Podman running:

```sh
npm ci
npm run dev:local
```

Open <http://127.0.0.1:5174> to try the app with sample recipes. No hosted
account is needed. The local setup does not connect to ChatGPT. See the
[local development guide](specs/local-development.md) for more options.

## Host your own instance

Recipier uses **Supabase** for sign-in and storage and a **Cloudflare Worker**
for the web app and MCP endpoint.

1. Set up a Supabase project and an app account, then apply the
   [database migrations](specs/database.md).
2. Fill in your project settings using [`.env.example`](.env.example) and deploy
   the Worker with `npm run deploy`. The [CI workflow](.github/workflows/ci.yml)
   runs checks without deploying.
3. To connect ChatGPT, configure Supabase OAuth with `/auth/connect` as the
   authorization path. Follow the
   [MCP setup guide](specs/mcp.md#self-hosted-mcp-setup) to
   register the callback and make the token audience match your Worker’s `/mcp`
   URL.

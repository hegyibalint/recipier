# Application

## Routing

- Use React Router's official `@react-router/fs-routes` convention in `app/routes/`.
- Dots separate URL segments, `$name` is a parameter, and `_index` is an index route.
- Use supported route folders (`auth.login/route.tsx`) to colocate page styles and
  helpers. Arbitrary nested directories do not define routes.
- API/resource routes use `.ts` files with loaders/actions and no default component.
- Keep shared services and components outside `routes/`. Do not add a custom scanner
  or a third-party routing convention.

## Application logic and tests

- Put shared application/backend logic in `lib/`, grouped by domain (recipes,
  planning, auth). Do not introduce a separate `features/` layer.
- Keep shared React UI in `components/` and route-specific UI in its route folder.
- Use the shared native `Dialog` for modal UI and `ConfirmDelete` for destructive
  confirmations, not browser `confirm()`. Keep route actions responsible for mutations.
- Colocate unit, component, and mocked handler tests as `*.test.ts` / `*.test.tsx`.
  Use official route folders so sibling tests/helpers are not endpoints.
- Use Vitest (`npm test`, `npm run test:watch`), not a custom TS transpilation loader.
- Cross-app tests and shared test fixtures/mocks live in root `tests/`.
  Future real-app/local-Supabase E2E tests belong in `tests/e2e/`, not `app/`.
- Direct database/RLS tests stay in `supabase/tests/database/`.
- Colocate the MCP transport, authentication, and tools in `routes/mcp/`.
  Tools call shared domain services directly. Keep MCP bearer OAuth separate from
  browser/API sessions. Never authenticate MCP with cookies or add application
  HTTP callbacks.
- Use `.server.ts` for modules that the browser must not import, not for pure
  helpers simply because a server route uses them.

## Styling

- Keep shared colors, borders, typography, and interaction tokens in `brand.css`.
  `style.css` owns base HTML styles and a few shared visual treatments.
- Put component and page styles in an adjacent `*.module.css`, imported by their owner.
- Use native CSS nesting for states, descendants, and media queries; keep nesting shallow.
- Consume `brand.css` tokens in modules rather than defining local palettes or border recipes.
  Use `--border` for hairline component edges, `--border-divider` for quiet separators,
  and `--radius` for rounded surfaces. Only intentional circles, capsules, full-screen
  surfaces, and joined inner edges use their own corner shapes.
  Field focus uses `--focus-field` inside the control; do not stack an outer outline on its border.
- Pages own layout around components; components own their internals. Use explicit variants
  when a component needs different presentations, rather than reaching into it from a page.
- Prefer local classes to styling IDs, cross-module selectors, or specificity overrides.

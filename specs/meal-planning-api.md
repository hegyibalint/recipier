# Meal-planning HTTP API

Planning routes are served by the React Router app on the same origin as its pages.
Route modules live in `app/routes/api.*/route.ts` using React Router's official
file-route convention; database operations live in
`app/lib/planning/service.server.ts` and use Supabase's Data API with user JWTs.
They do not call the `get_meal_plan` database RPC.

## Authentication during migration

Send `Authorization: Bearer <Supabase user-session access token>` on every request.
The app verifies the signature, issuer, audience, expiry, role, and allowed user.
Only `DEMO_USER_ID` is allowed; OAuth/MCP client tokens are rejected. Do not send
service-role keys. An application API key is not required.

Browser cookie authentication is not implemented yet. Existing pages still use
browser sessions; these API routes ignore cookies. Planning sends its Supabase
browser-session access token to manage the reusable meal rows. Cross-origin
browser access is not enabled.

Every API response uses `Cache-Control: private, no-store`. Ownership always comes
from the verified session, not from JSON fields. Unknown request fields are errors.

## Weekly planning board

`/planning` presents a Monday–Sunday matrix with one row per named mealtime,
in the user's saved order. Rows don't have clock times. **+ Add meal time** below
the matrix appends a row. **Edit rows** reveals up/down, rename, and delete
controls beside the meal names. Changes apply to every week. Moving or renaming
a row keeps its assignments; deleting one requires confirmation. The former
`/meals` URL redirects to Planning.

Previous/next navigation uses `?week=YYYY-MM-DD`, normalized to Monday. A shared
stepper places the week range first and groups both previous/next links on the
right, keeping their positions stable as the label width changes. The same layout
presents the recipe yield with both decrement/increment buttons on the right,
disabled until yield adjustment is implemented. “Edit rows” and “Go to current week” share a
right-aligned action group. The current week uses the browser's local calendar date.
Empty slots have a half-opacity raised surface, a dashed outline, and a centered
plus; hover or keyboard focus reveals “Add recipe.” Touch layouts always show
that label. Filled slots have a solid surface and outline, with all assigned
recipe titles. Both use the shared dark component-border token; decorative
section dividers use the separate, muted divider token.

At viewport widths up to 64rem the board shows one day at a time, with a seven-day
picker and meals stacked vertically, without horizontal scrolling. `?day=YYYY-MM-DD`
selects a date within the loaded week; invalid or out-of-week values fall back to
today if it is in that week, otherwise Monday. Changing only the day query reuses
loaded week data. Day selection survives browser navigation and slot-page back
links. Desktop always shows all seven days.

Each slot links to `/planning/:date/:mealtimeId`, a standalone mobile-friendly
page with its date, meal time, existing assignments, and a searchable recipe list.
Adding a recipe creates a one-batch assignment through `/api/meal-plan` and stays
on the slot page, refreshing its assignments while preserving the search and
scroll position. Multiple recipes (and repeated assignments) are supported.
Removal also stays on the page and deletes only the assignment, after checking
it belongs to the selected slot. The back link returns to that date's week and
selects the same day in the compact view.
Recipe quantity editing is not part of this UI yet.

The calendar and slot page load entries through the existing API. The recipe
picker follows all pages of lightweight, owner-filtered ID/title/subtitle queries
via the browser's Supabase client, rather than the newest-50 full-recipe list.
Failed queries are shown as errors, never as apparently empty plans. The calendar
shows current recipe titles and any existing batch multipliers.

## Shopping list page

`/shopping-list` defaults to the current local planning week; the **Shopping list**
link on Planning uses the displayed week. The page's **From** and **Through** dates
are both inclusive. It sends the API an exclusive end date one day after **Through**.

The page groups usages by the combination of ingredient ID, name, and optional
description. Names and descriptions ignore case and surrounding whitespace.
Each combination gets its own row, so soft tofu and hard tofu have separate
totals. Only matching units (ignoring surrounding whitespace) are summed within
a row. Bare mentions do not add to the total. The page does not convert units,
round up to pack sizes, or subtract pantry stock. Expand an ingredient to see
how much each recipe contributes, including repeated assignments of that recipe.

## Routes

| Method | Path | Success response |
| --- | --- | --- |
| GET | `/api/mealtimes` | `200 { "mealtimes": [...] }` |
| POST | `/api/mealtimes` | `201` created mealtime |
| PATCH | `/api/mealtimes` | `204` after saving the order |
| PATCH | `/api/mealtimes/:id` | `200` renamed mealtime |
| DELETE | `/api/mealtimes/:id` | `204` with no body |
| GET | `/api/meal-plan?from=2026-11-09&to=2026-11-16` | `200 { "entries": [...] }` |
| POST | `/api/meal-plan` | `201` created entry |
| PATCH | `/api/meal-plan/:id` | `200` updated entry |
| DELETE | `/api/meal-plan/:id` | `204` with no body |
| POST | `/api/shopping-list` | `200 { "items": [...] }` |

GET endpoints also support HEAD. JSON requests require `Content-Type: application/json`.

### Mealtimes

Create or rename with `{ "name": "Dinner" }`. Names are trimmed and must not be
blank. Duplicate names are allowed. New rows append to the end of the list.

To reorder, PATCH the collection with `{ "ids": ["<uuid>", "<uuid>"] }`. Supply
every owned row exactly once, in the desired order. If the rows no longer match
the submitted set, the whole reorder is rejected with `409`.

- Responses contain `id`, `name`, one-based `position`, and `created_at`.
  List responses also include read-only `planned_meals_count`: the number of all
  assignments to that mealtime, including past/future dates and repeated recipes.
  The count is an owner-scoped database aggregate, not a date-limited plan query.
- Deleting a mealtime atomically cascades to all its meal-plan entries. Recipes,
  other mealtimes, and their assignments are kept. The browser confirmation shows
  the count and explains this consequence before submitting. Counts reflect the
  list load; deletion removes all assignments present at deletion time.

### Meal-plan entries

```json
{
  "date": "2026-11-10",
  "mealtime_id": "00000000-0000-4000-8000-000000000002",
  "recipe_id": "00000000-0000-4000-8000-000000000003",
  "multiplier": 0.5
}
```

- `multiplier` is a finite positive number of recipe batches, defaulting to `1`
  on creation. It is not a universal serving count.
- PATCH accepts any nonempty subset of these fields; omitted values stay unchanged.
- Dates are real `YYYY-MM-DD` calendar dates in years 0001–9999; references are UUIDs.
- Multiple recipes, including repeated assignments, may share a date/mealtime.
- Both referenced resources must belong to the caller. Recipes with assignments
  cannot be deleted until those entries are removed or reassigned. Deleting a
  mealtime instead cascades to its assignments, without deleting any recipes.
- Responses contain `id`, `date`, `mealtime_id`, `recipe_id`, `multiplier`, and `created_at`.

### Ranges and shopping list

Both range operations require `from < to`: inclusive `from`, exclusive `to`.
The meal-plan GET accepts exactly one of each query parameter, with no extra keys.
The shopping-list POST takes the same fields as JSON:

```sh
curl "$APP_ORIGIN/api/shopping-list" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"from":"2026-11-09","to":"2026-11-16"}'
```

```json
{
  "items": [
    {
      "id": "tofu", "name": "Tofu", "description": "Soft tofu", "amount": 300, "unit": "g",
      "source": { "id": "<recipe uuid>", "title": "Chilled tofu" }
    }
  ]
}
```

Ingredient usages are concatenated from planned recipes. Explicit quantities are
scaled by each entry's multiplier; bare mentions remain `amount: null`. Missing
units are `null`. Each usage includes its recipe-local ingredient `id`, original
`name`, and `description` when present, plus the source recipe's ID and title.
Repeated references and units are preserved.
Each component's own steps are visited once; component references are not traversed.
There is no reconciliation, deduplication, unit conversion, pantry subtraction,
or serving inference. Empty ranges return empty arrays.

Lists follow all database pages instead of silently truncating at PostgREST's row
limit. Entries are ordered by date/id; mealtimes by position/id. A failed or
incomplete page, invalid saved recipe, or numeric overflow fails the entire request.
There is no snapshot isolation across pages: concurrent edits may affect a query.
Entries refer to current recipe and mealtime data, not snapshots.

## Errors

```json
{ "error": { "code": "invalid_request", "message": "Request validation failed.", "issues": [{ "path": "to", "message": "Expected from < to (inclusive from, exclusive to)." }] } }
```

`issues` is included for schema-validation failures. Upstream details and saved
recipe contents are not exposed in errors.

| Status | Meaning |
| --- | --- |
| 400 | Invalid JSON, parameters, or data constraints |
| 401 | Missing or invalid session; includes `WWW-Authenticate: Bearer` |
| 403 | Disallowed user/OAuth session or denied operation |
| 404 | Requested row is absent or inaccessible |
| 405 | Unsupported method; includes `Allow` |
| 409 | Referenced resource unavailable, still in use, or mealtime list changed |
| 415 | Expected JSON content type |
| 502 | Storage/query/extraction failure; no partial result |
| 503 | Missing application configuration |

Mutations are not automatically retried. If a response is lost, inspect stored
state before repeating creation, since repeated assignments are intentionally valid.

## Migration status

The [initial database baseline](database.md) defines the composite mealtime
foreign key with `ON DELETE CASCADE`. The recipe foreign key prevents deleting
referenced recipes. The legacy `get_meal_plan` RPC remains in the baseline;
app routes do not use it. The ordered-mealtimes migration initializes positions
from the previous start-time/ID sort and removes the old clock fields. Row IDs
and existing assignments are unchanged. Apply it before deploying this UI and API.

The legacy shopping-list and MCP Edge Function source and deployment steps have
been removed. Use `/api/shopping-list` for raw shopping-list usages. The Worker
also provides [recipe tools and a read-only shopping-list tool](mcp.md) at `/mcp`.
See [MCP](mcp.md) for the pending hosted OAuth activation. This code change does
not delete any already-hosted functions.

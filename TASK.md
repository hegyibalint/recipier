# Readability follow-ups

Follow-ups from the general cleanup, handled separately so behavior is easy to
compare before and after.

1. [x] **Planning slot:** [`route.tsx`](app/routes/_app.planning_.$date.$mealtimeId/route.tsx)
   buries the assigned recipes and recipe picker inside nested page states.
   Make those two sections visible in the page outline with route-local components.
   Preserve the search draft on submission and keep URL-derived slot checks in the action.
2. [x] **Mealtimes:** [`route.tsx`](app/routes/_app.meals/route.tsx) mixes the page outline,
   edit form, external save button, and deletion-impact copy. Pull the existing-mealtime
   card into a route-local component and keep create/edit form behavior shared locally.
3. [x] **Recipe contracts:** [`schema.ts`](app/lib/recipes/schema.ts) buries the document
   shape under a long agent-facing template description, while [`validate.ts`](app/lib/recipes/validate.ts)
   leaves the boundary between indexing IDs, resolving references, and checking cycles implicit.
   Separate the guidance from the shape and name the validation passes. Preserve published
   JSON Schema metadata and validation issue paths and order.
4. [x] **README:** [`README.md`](README.md) repeats routing, OAuth, and deployment details
   already covered by the specs and still calls Meals and Planning placeholders.
   Make it a short entry point for setup and navigation; move or link to operational details
   rather than keeping two copies.

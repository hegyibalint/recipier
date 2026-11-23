# Code style

## Function layout

Choose function boundaries for readability, not line count. Keep related work
together when the sequence is easier to follow in one place. Extract a helper
when its name gives the caller a useful abstraction, not just to make the
function shorter.

In non-trivial pipelines and other multi-stage functions, separate logical
stages with blank lines. Use short comments to name what each stage accomplishes
when that helps the reader skim the flow; let the code show how. Skip headings
in straightforward functions, and don't add braces just to mark a stage.

Outside stage headings, comment sparingly. Explain non-obvious reasons,
constraints, or ordering requirements, or point to the specification that drives
the behavior. Don't restate what the code already says.

For example (illustrative TypeScript):

```ts
async function importRecipes(file: File) {
  // Validate the entire batch before writing anything.
  const raw = JSON.parse(await file.text());
  const recipes = recipeBatchSchema.parse(raw);

  // Save the batch atomically so a failed import leaves no partial results.
  const imported = await database.transaction((tx) =>
    tx.insertRecipes(recipes)
  );

  // Refresh the list only after the transaction commits.
  await recipeList.invalidate();
  return imported;
}
```

## Organization

### Route ownership

Keep code that serves only one route in that route’s directory under
`app/routes/`. Use `app/lib/` for shared application logic and domain logic
that doesn’t belong to a particular route.

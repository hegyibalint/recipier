# Recipier step references v1

Status: draft

A step is ordinary flowing text with typed references to recipe-wide ingredients and recipe components. This is reference markup, not a general-purpose template language.

## References

```text
${i:<id>}
${i:<id>:<amount>}
${i:<id>:<amount>:<unit>}

${c:<id>}
${c:<id>:<amount>}
${c:<id>:<amount>:<unit>}
```

Examples:

```text
Beat ${i:butter:100:g} until soft.
Fold in the remaining ${i:butter}.
Spread ${c:buttercream} over ${c:cake-layers}.
Place ${c:dumpling:4} in each bowl.
```

## Grammar

```ebnf
template  = { escaped-opener | reference | text } ;
escaped-opener = "\${" ;
reference = "${", kind, ":", id,
            [ ":", amount, [ ":", unit ] ], "}" ;
kind      = "i" | "c" ;
id        = initial-segment, { "-", segment } ;
initial-segment = lowercase-letter,
                  { lowercase-letter | digit } ;
segment   = (lowercase-letter | digit),
            { lowercase-letter | digit } ;
amount    = positive-json-number ;
unit      = unit-character, { unit-character } ;

unit-character = any Unicode character except ":" or "}" ;
```

Whitespace is significant outside references and is not allowed around the kind, ID, amount, or separators. A unit may contain spaces.

## Resolution

- `i` resolves an ID from the recipe-wide ingredient list.
- `c` resolves a component ID from the recipe.
- Ingredient IDs and names must be unique within the recipe.
- Component IDs must be unique within the recipe.
- A component reference cannot refer to its own component.
- A referenced component must also be present in the current component's `depends_on` list.

There is no separate ingredient list on a component. Its ingredients and their quantities are derived from the ingredient references in its steps.

## Ingredient identity and preparation state

Ingredient definitions identify ingredients, not their state at a particular use.
Do not put preparation state in ingredient names or IDs. Define one ingredient
with ID `garlic` and name `garlic`, not separate `garlic, minced` and `whole garlic`
ingredients. Reuse the same ID across those uses.

Put each use's preparation state in ordinary step text outside the reference:

```text
Add ${i:garlic:10:g}, minced.
Add ${i:garlic:2:cloves} whole.
```

When the cook needs to perform the preparation, make it an instruction:

```text
Mince ${i:garlic:10:g}, then add it.
```

Do not add a state segment to the reference or put state into the unit.
This is authoring guidance supplied to the model, not a new grammar or a
natural-language validation rule; existing saved recipes are not rewritten.

## Ingredient calculations

Each ingredient reference is interpreted in the component containing the step:

- `${i:salt}` declares an unquantified use of `salt`.
- `${i:egg:2}` declares a use of two `egg` items.
- `${i:butter:100:g}` declares a use of 100 g of `butter`.

A component's ingredient set is the unique set of ingredient IDs referenced by its steps.

For aggregation:

- quantified references with the same ingredient ID and exact unit are added;
- different units remain separate quantities;
- bare references are deduplicated and carry no quantity;
- a bare reference does not add another quantity when quantified references for that ingredient exist.

Repeated quantified references are therefore additive. When text merely mentions an ingredient again without adding another amount, it should use the bare form.

Recipier does not compare different units, perform unit conversion, infer density, or validate that quantities describe every part of a physical ingredient. One head of cabbage and 100 g of cabbage may coexist as separate quantities.

Component references establish narrative links and dependencies. Version 1 does not use component-reference quantities to scale ingredient calculations.

## Validation

Recipier parses every step when accepting a recipe and rejects it when:

- a reference is malformed;
- its kind is not `i` or `c`;
- its amount is not a positive number;
- a unit is present without an amount;
- an ingredient ID does not exist in the recipe-wide ingredient list;
- a component ID does not exist in the recipe;
- a component references itself; or
- a referenced component is not declared in `depends_on`.

Dependency references must exist, must not reference their own component, and must form an acyclic graph. JSON Schema validates the shape of the document; these referential constraints are application-level validation.

Unused ingredient definitions are valid, though applications may report them as warnings.

## Rendering

A reference renders as the referenced ingredient name or component title. An explicit amount and unit are included when present.

Given an ingredient named `butter`:

```text
${i:butter}       -> butter
${i:butter:100:g} -> 100 g butter
```

## Escaping

A literal `${` is written as `\${`.
Recognize the escaped opener before attempting to parse a reference.
Only the backslash immediately before `${` escapes the opener; other backslashes are ordinary text.

```text
The text \${i:not-a-reference} is not interpreted.
```

In JSON strings, double the backslash as required by JSON escaping:

```json
{ "text": "The text \\${i:not-a-reference} is not interpreted." }
```

No expressions, conditionals, loops, function calls, or nested references are supported.

## Complete recipe example

This complete recipe document demonstrates recipe-wide ingredient definitions, separate preparation components, and assembly dependencies.

```json
{
  "title": "Chocolate Layer Cake",
  "subtitle": "Two layers with buttercream frosting",
  "description": "A chocolate cake filled and covered with buttercream, assembled from separately prepared layers and frosting.",
  "yield": {
    "amount": 1,
    "unit": "cake"
  },
  "ingredients": [
    {
      "id": "all-purpose-flour",
      "name": "all-purpose flour"
    },
    {
      "id": "sugar",
      "name": "sugar"
    },
    {
      "id": "butter",
      "name": "butter"
    },
    {
      "id": "powdered-sugar",
      "name": "powdered sugar"
    }
  ],
  "components": [
    {
      "id": "cake-layers",
      "title": "Cake Layers",
      "yield": {
        "amount": 2,
        "unit": "layer"
      },
      "steps": [
        {
          "text": "Mix ${i:all-purpose-flour:250:g} and ${i:sugar:200:g} into the cake batter."
        },
        {
          "text": "Divide the batter between two pans and bake."
        }
      ]
    },
    {
      "id": "buttercream",
      "title": "Buttercream",
      "steps": [
        {
          "text": "Beat ${i:butter:250:g} and ${i:powdered-sugar:300:g} until light and smooth."
        }
      ]
    },
    {
      "id": "assembly",
      "title": "Assembly",
      "depends_on": [
        "cake-layers",
        "buttercream"
      ],
      "steps": [
        {
          "text": "Fill and cover ${c:cake-layers} with ${c:buttercream}."
        }
      ]
    }
  ]
}
```

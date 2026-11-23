export const stepReferenceGuidance = `# Recipier step references v1

## Generic format

Write ordinary flowing instructions with references in this format:

\`\`\`text
\${kind:id[:amount[:unit]]}
\`\`\`

- \`kind\` is \`i\` for an ingredient or \`c\` for a component.
- \`id\` is the referenced ingredient or component ID, following the ID pattern in the schema.
- \`amount\` is optional and must be a finite number strictly greater than zero.
- \`unit\` is optional, requires an amount, and must contain non-whitespace text.

The labels are placeholders and the brackets indicate optional segments; do not write them literally.
Use JSON-number notation such as \`2\`, \`0.5\`, or \`1e2\`, not \`1/2\`, \`½\`, \`+1\`, or \`01\`.
Do not add whitespace around the kind, ID, amount, or separators.
Units may contain spaces and Unicode characters, but not \`:\` or \`}\`.
Text outside references is preserved.
A reference renders as the ingredient name or component title, with its explicit amount and unit when present.
No expressions, conditionals, loops, function calls, or nested references are supported.

Write \`\\\${\` for a literal \`\${\` opener.
In JSON strings, double the backslash as required by JSON escaping.
Other backslashes are ordinary text.

\`\`\`text
The text \\\${i:not-a-reference} is not interpreted.
\`\`\`

## Ingredient references (\`i\`)

The kind \`i\` resolves an ID from the recipe-wide \`ingredients\` list.
Declare each ingredient once, with a unique ID and a unique name (ignoring case and surrounding whitespace).
Ingredient usage, amounts, and units belong in step references, not in a separate component ingredient list.

Do not put preparation state in ingredient names or IDs.
For example, define one ingredient named "garlic" with ID "garlic", not separate "garlic, minced" and "whole garlic" ingredients.
Reuse that same ID for every preparation state. Write each use's state as ordinary step text outside the reference:

\`\`\`text
Add \${i:garlic:10:g}, minced.
Add \${i:garlic:2:cloves} whole.
\`\`\`

If preparation must happen in the step, write it as an instruction, such as "Mince \${i:garlic:10:g}, then add it."
Do not add a state segment to the reference or put state into the unit.

The three forms are:

- \`\${i:butter}\` mentions butter without adding a quantity.
- \`\${i:egg:2}\` uses two egg items.
- \`\${i:butter:100:g}\` uses 100 g of butter.

Within each component, quantified references with the same ingredient ID and exact unit are additive.
Use a bare reference when merely mentioning an ingredient again:

\`\`\`text
Beat \${i:butter:100:g} until soft.
Continue beating \${i:butter} until fluffy.
\`\`\`

These steps use 100 g of butter total; the second reference does not add another 100 g.
Repeated bare references are deduplicated and carry no quantity.
Different units remain separate quantities; Recipier does not convert units or infer density.
Unused ingredient definitions are valid.

## Component references (\`c\`)

The kind \`c\` resolves an ID from the recipe's \`components\` list.
Component IDs must be unique within the recipe.

The three forms are:

- \`\${c:sauce}\` refers to the sauce component without specifying a quantity.
- \`\${c:dumpling:4}\` refers to four dumplings produced by the dumpling component.
- \`\${c:sauce:100:ml}\` refers to 100 ml of the sauce component.

Every referenced component must appear in the current component's \`depends_on\` list.
A component cannot reference or depend on itself.
Dependencies must exist and form an acyclic graph.
Component-reference quantities do not scale ingredient calculations in v1.

\`\`\`text
Spread \${c:buttercream} over \${c:cake-layers}.
\`\`\`

The component containing this step must declare \`"depends_on": ["buttercream", "cake-layers"]\`.`;

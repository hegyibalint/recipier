import { recipeSchema, type Component, type Recipe } from './schema.ts';
import { parseTemplate } from './template.ts';

export type Issue = { code: string; path: string; message: string };

export class RecipeValidationError extends Error {
  constructor(public issues: Issue[]) {
    super('Recipe validation failed.');
    this.name = 'RecipeValidationError';
  }
}

export function parseRecipe(value: unknown): Recipe {
  // Validate the document shape before inspecting identities and references.
  const result = recipeSchema.safeParse(value);
  if (!result.success) {
    throw new RecipeValidationError(result.error.issues.map(issue => ({
      code: issue.code,
      path: issue.path.map(segment => '/' + String(segment).replace(/~/g, '~0').replace(/\//g, '~1')).join(''),
      message: issue.message,
    })));
  }
  const input = result.data;

  const issues: Issue[] = [];
  const add = (code: string, path: string, message: string) => issues.push({ code, path, message });
  validateYield(input.yield, '/yield', issues);

  // Index ingredients and check their IDs and normalized names for duplicates.
  const ingredientIds = new Set<string>();
  const ingredientNames = new Set<string>();
  for (const [index, ingredient] of input.ingredients.entries()) {
    const path = `/ingredients/${index}`;
    if (ingredientIds.has(ingredient.id)) {
      add('duplicate_ingredient_id', path + '/id', 'Ingredient IDs must be unique.');
    }
    ingredientIds.add(ingredient.id);

    const name = ingredient.name.trim().toLowerCase();
    if (!name) {
      add('required', path + '/name', 'Ingredient name must not be empty.');
    } else if (ingredientNames.has(name)) {
      add('duplicate_ingredient_name', path + '/name', 'Ingredient names must be unique (ignoring case and surrounding whitespace).');
    }
    ingredientNames.add(name);
  }

  // Index every component first so forward references can be resolved.
  const componentIds = new Set<string>();
  for (const [index, component] of input.components.entries()) {
    const path = `/components/${index}`;
    if (componentIds.has(component.id)) {
      add('duplicate_component_id', path + '/id', 'Component IDs must be unique.');
    }
    componentIds.add(component.id);

    if (component.title !== undefined && !component.title.trim()) {
      add('empty', path + '/title', 'Component title must not be empty.');
    }
    validateYield(component.yield, path + '/yield', issues);
  }

  // Resolve declared dependencies and step references against those indexes.
  for (const [index, component] of input.components.entries()) {
    const path = `/components/${index}`;
    const dependencies = new Set(component.depends_on);
    if (dependencies.size !== (component.depends_on?.length ?? 0)) {
      add('uniqueItems', path + '/depends_on', 'Dependencies must be unique.');
    }
    for (const [dependencyIndex, dependency] of (component.depends_on ?? []).entries()) {
      const dependencyPath = `${path}/depends_on/${dependencyIndex}`;
      if (dependency === component.id) {
        add('self_dependency', dependencyPath, 'A component cannot depend on itself.');
      } else if (!componentIds.has(dependency)) {
        add('unknown_component', dependencyPath, `Component ${JSON.stringify(dependency)} does not exist.`);
      }
    }

    for (const [stepIndex, step] of component.steps.entries()) {
      const stepPath = `${path}/steps/${stepIndex}/text`;
      if (!step.text.trim()) add('required', stepPath, 'Step text must not be empty.');
      try {
        for (const reference of parseTemplate(step.text)) {
          if (reference.kind === 'i') {
            if (!ingredientIds.has(reference.id)) {
              add('unknown_ingredient', stepPath, `Ingredient ${JSON.stringify(reference.id)} does not exist.`);
            }
            continue;
          }

          if (reference.id === component.id) {
            add('self_component_reference', stepPath, 'A component cannot reference itself.');
          } else if (!componentIds.has(reference.id)) {
            add('unknown_component', stepPath, `Component ${JSON.stringify(reference.id)} does not exist.`);
          } else if (!dependencies.has(reference.id)) {
            add('undeclared_dependency', stepPath, `Component ${JSON.stringify(reference.id)} must appear in depends_on.`);
          }
        }
      } catch (error) {
        add('invalid_template', stepPath, error instanceof Error ? error.message : 'Invalid step template.');
      }
    }
  }

  // Check the graph last; valid individual edges can still form a cycle.
  if (hasDependencyCycle(input.components)) {
    add('dependency_cycle', '/components', 'Component dependencies must form an acyclic graph.');
  }

  if (issues.length) throw new RecipeValidationError(issues);
  return input;
}

function validateYield(value: Recipe['yield'], path: string, issues: Issue[]) {
  if (value && !value.unit.trim()) issues.push({ code: 'required', path: path + '/unit', message: 'Yield unit must not be empty.' });
}

function hasDependencyCycle(components: Component[]): boolean {
  // Kahn's algorithm avoids recursion limits on deep dependency graphs.
  const dependents = new Map(components.map(component => [component.id, [] as string[]]));
  const remaining = new Map<string, number>();
  for (const component of components) {
    const knownDependencies = (component.depends_on ?? []).filter(id => dependents.has(id));
    remaining.set(component.id, knownDependencies.length);
    for (const id of knownDependencies) dependents.get(id)!.push(component.id);
  }

  const ready = [...remaining.keys()].filter(id => remaining.get(id) === 0);
  for (let index = 0; index < ready.length; index++) {
    for (const id of dependents.get(ready[index])!) {
      const count = remaining.get(id)! - 1;
      remaining.set(id, count);
      if (count === 0) ready.push(id);
    }
  }
  return ready.length !== remaining.size;
}

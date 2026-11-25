import type { Recipe } from '../app/lib/recipes/schema.ts';

// Deliberately public credentials for the disposable local stack only.
export const localUser = {
  id: '90000000-0000-4000-8000-000000000001',
  email: 'dev@recipier.test',
  password: 'recipier-local-only',
};

export const localRecipes: Recipe[] = [
  {
    title: 'Lemon pasta',
    subtitle: 'A bright, buttery weeknight spaghetti',
    description: 'Lemon zest and Parmesan make a silky sauce with a little pasta water. A quick dinner with a fresh, sharp finish.',
    yield: { amount: 2, unit: 'servings' },
    ingredients: [
      { id: 'spaghetti', name: 'spaghetti' },
      { id: 'butter', name: 'butter' },
      { id: 'lemon', name: 'lemon' },
      { id: 'parmesan', name: 'Parmesan' },
      { id: 'salt', name: 'salt' },
    ],
    components: [{ id: 'main', title: 'Pasta', steps: [
      { text: 'Cook ${i:spaghetti:200:g} in water seasoned with ${i:salt}. Reserve a mug of cooking water before draining.' },
      { text: 'Melt ${i:butter:40:g}. Zest and juice ${i:lemon:1}, then stir into the butter.' },
      { text: 'Toss in the ${i:spaghetti} with a splash of cooking water. Fold in ${i:parmesan:50:g}, finely grated, until glossy.' },
    ] }],
  },
  {
    title: 'Chickpea bowls',
    subtitle: 'Roasted chickpeas with lemon yogurt',
    description: 'Crisp-edged chickpeas sit over fluffy rice with a cool yogurt sauce. The separate components make this a useful recipe for preparing ahead.',
    yield: { amount: 4, unit: 'bowls' },
    ingredients: [
      { id: 'chickpeas', name: 'chickpeas' },
      { id: 'olive-oil', name: 'olive oil' },
      { id: 'paprika', name: 'smoked paprika' },
      { id: 'rice', name: 'rice' },
      { id: 'yogurt', name: 'plain yogurt' },
      { id: 'lemon', name: 'lemon' },
      { id: 'cucumber', name: 'cucumber' },
    ],
    components: [
      { id: 'chickpeas', title: 'Roasted chickpeas', steps: [
        { text: 'Heat the oven to 220°C. Pat ${i:chickpeas:480:g} dry, then toss with ${i:olive-oil:2:tbsp} and ${i:paprika:1:tsp}.' },
        { text: 'Spread the ${i:chickpeas} on a tray and roast for 25 minutes, shaking halfway through.' },
      ] },
      { id: 'rice', title: 'Rice', steps: [{ text: 'Cook ${i:rice:280:g} according to the packet, then fluff with a fork.' }] },
      { id: 'sauce', title: 'Lemon yogurt', yield: { amount: 200, unit: 'g' }, steps: [
        { text: 'Stir ${i:yogurt:200:g} with the juice of ${i:lemon:1}.' },
      ] },
      { id: 'assemble', title: 'Assemble the bowls', depends_on: ['chickpeas', 'rice', 'sauce'], steps: [
        { text: 'Slice ${i:cucumber:1}. Divide ${c:rice} between bowls, add ${c:chickpeas} and the cucumber, and spoon over ${c:sauce}.' },
      ] },
    ],
  },
  {
    title: 'Pancakes',
    subtitle: 'Fluffy pancakes with blueberries',
    description: 'Soft pancakes with pockets of warm fruit and lightly golden edges. Serve straight from the pan while the next batch cooks.',
    yield: { amount: 8, unit: 'pancakes' },
    ingredients: [
      { id: 'flour', name: 'plain flour' },
      { id: 'baking-powder', name: 'baking powder' },
      { id: 'milk', name: 'milk' },
      { id: 'egg', name: 'egg' },
      { id: 'blueberries', name: 'blueberries' },
      { id: 'butter', name: 'butter' },
    ],
    components: [{ id: 'main', steps: [
      { text: 'Whisk ${i:flour:150:g} with ${i:baking-powder:1:tsp}. Beat in ${i:milk:200:ml} and ${i:egg:1} until just combined.' },
      { text: 'Fold in ${i:blueberries:100:g}. Melt ${i:butter:20:g} in a frying pan over medium heat.' },
      { text: 'Spoon in small rounds of batter. Cook until bubbles appear, then flip and cook the other side until golden.' },
    ] }],
  },
  {
    title: 'Garlic butter',
    subtitle: 'Parsley and garlic finishing butter',
    description: 'A savory butter for warm bread, baked potatoes, or vegetables. Keep chilled and slice off what you need.',
    ingredients: [
      { id: 'butter', name: 'butter' },
      { id: 'garlic', name: 'garlic' },
      { id: 'parsley', name: 'parsley' },
    ],
    components: [{ id: 'main', steps: [
      { text: 'Soften ${i:butter:100:g}. Mince ${i:garlic:2:cloves} and finely chop ${i:parsley:10:g}.' },
      { text: 'Mix everything together. Roll into a log in baking paper and chill until firm.' },
    ] }],
  },
];

export const localRecipeId = (index: number) => `91000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
export const localMealtimes = [
  { id: '92000000-0000-4000-8000-000000000001', name: 'Breakfast' },
  { id: '92000000-0000-4000-8000-000000000002', name: 'Dinner' },
];

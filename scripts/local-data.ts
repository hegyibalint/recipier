import { calendarWeek, localDate } from '../app/lib/planning/calendar.ts';
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
      { text: 'Melt ${i:butter:50:g}. Zest and juice ${i:lemon:1}, then stir into the butter.' },
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
      { text: 'Fold in ${i:blueberries:100:g}. Melt ${i:butter:3:tbsp} in a frying pan over medium heat.' },
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
  // The shared tofu ID and name still yield separate rows for different descriptions.
  {
    title: 'Chilled tofu',
    subtitle: 'Soft tofu with soy sauce and scallions',
    description: 'Tender chilled tofu dressed with soy sauce and fresh scallions.',
    yield: { amount: 2, unit: 'servings' },
    ingredients: [
      { id: 'tofu', name: 'Tofu', description: 'Soft tofu' },
      { id: 'soy-sauce', name: 'soy sauce' },
      { id: 'scallion', name: 'scallion' },
    ],
    components: [{ id: 'main', steps: [
      { text: 'Drain ${i:tofu:300:g} gently and slide it onto a plate.' },
      { text: 'Drizzle with ${i:soy-sauce:1:tbsp} and finish with ${i:scallion:1}, finely sliced.' },
    ] }],
  },
  {
    title: 'Crispy tofu',
    subtitle: 'Pan-fried hard tofu with soy glaze',
    description: 'Hard tofu stays intact in the pan and gets crisp before a quick soy glaze.',
    yield: { amount: 2, unit: 'servings' },
    ingredients: [
      { id: 'tofu', name: 'Tofu', description: 'Hard tofu' },
      { id: 'oil', name: 'neutral oil' },
      { id: 'soy-sauce', name: 'soy sauce' },
    ],
    components: [{ id: 'main', steps: [
      { text: 'Pat ${i:tofu:400:g} dry and cut it into cubes.' },
      { text: 'Fry in ${i:oil:1:tbsp}, turning until golden. Add ${i:soy-sauce:2:tbsp} and toss to coat.' },
    ] }],
  },
  {
    title: 'Mapo tofu',
    subtitle: 'Sichuan tofu with pork and fermented chili bean paste',
    description: 'Tender tofu simmers in a spicy, numbing sauce with ground pork and fermented black beans.',
    yield: { amount: 2, unit: 'servings' },
    ingredients: [
      { id: 'tofu', name: 'Tofu', description: 'Soft tofu' },
      { id: 'oil', name: 'neutral oil' },
      { id: 'pork', name: 'ground pork' },
      { id: 'doubanjiang', name: 'doubanjiang', description: 'Sichuan fermented chili bean paste' },
      { id: 'douchi', name: 'douchi', description: 'Fermented black soybeans' },
      { id: 'cornstarch', name: 'cornstarch' },
      { id: 'sichuan-pepper', name: 'Sichuan peppercorns' },
    ],
    components: [{ id: 'main', steps: [
      { text: 'Toast ${i:sichuan-pepper:1:tsp} in a dry wok, then grind to a powder.' },
      { text: 'Brown ${i:pork:100:g} in ${i:oil:1:tbsp}. Fry ${i:doubanjiang:1:tbsp} and ${i:douchi:1:tsp}, chopped, until fragrant.' },
      { text: 'Add half a cup of water and gently slide in ${i:tofu:350:g}, cubed. Simmer for five minutes.' },
      { text: 'Stir ${i:cornstarch:2:tsp} into a splash of cold water, add it to the wok, and simmer until glossy. Finish with the ground peppercorns.' },
    ] }],
  },
  {
    title: 'Home-style tofu',
    subtitle: 'Pan-fried tofu braised with peppers and doubanjiang',
    description: 'Golden tofu slices soak up a savory chili bean sauce while the peppers stay crisp.',
    yield: { amount: 2, unit: 'servings' },
    ingredients: [
      { id: 'tofu', name: 'Tofu', description: 'Firm tofu' },
      { id: 'oil', name: 'neutral oil' },
      { id: 'bell-pepper', name: 'bell pepper', description: 'Green bell pepper' },
      { id: 'doubanjiang', name: 'doubanjiang', description: 'Sichuan fermented chili bean paste' },
      { id: 'soy-sauce', name: 'soy sauce', description: 'Chinese light soy sauce' },
      { id: 'cornstarch', name: 'cornstarch' },
    ],
    components: [{ id: 'main', steps: [
      { text: 'Slice ${i:tofu:400:g} into triangles and pat dry. Pan-fry in ${i:oil:2:tbsp} until golden, then set aside.' },
      { text: 'Fry ${i:doubanjiang:2:tsp} in the remaining oil until fragrant. Add ${i:bell-pepper:1}, sliced, and stir-fry briefly.' },
      { text: 'Return the tofu to the pan with ${i:soy-sauce:1:tbsp} and half a cup of water. Simmer for three minutes.' },
      { text: 'Mix ${i:cornstarch:1:tsp} with a splash of cold water. Stir into the sauce and briefly simmer to thicken.' },
    ] }],
  },
];

export const localRecipeId = (index: number) => `91000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
export const localMealtimes = [
  { id: '92000000-0000-4000-8000-000000000001', name: 'Breakfast' },
  { id: '92000000-0000-4000-8000-000000000002', name: 'Dinner' },
];

export function localPlan(now = new Date()) {
  const { days } = calendarWeek(null, localDate(now));
  const meals = [
    { recipe: 'Pancakes', day: 5, mealtime: 0 },
    { recipe: 'Chilled tofu', day: 5, mealtime: 1 },
    { recipe: 'Crispy tofu', day: 6, mealtime: 1 },
    { recipe: 'Lemon pasta', day: 6, mealtime: 1 },
    { recipe: 'Mapo tofu', day: 5, mealtime: 1 },
    { recipe: 'Home-style tofu', day: 6, mealtime: 1 },
  ];
  const entries = meals.map(({ recipe, day, mealtime }, index) => {
    const recipeIndex = localRecipes.findIndex(item => item.title === recipe);
    if (recipeIndex === -1) throw new Error(`Missing local fixture: ${recipe}`);
    return {
      id: `93000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
      date: days[day],
      mealtime_id: localMealtimes[mealtime].id,
      recipe_id: localRecipeId(recipeIndex),
      multiplier: 1,
    };
  });
  return { from: days[5], through: days[6], entries };
}

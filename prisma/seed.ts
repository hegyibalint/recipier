import { Ingredient, Meal, Mealtime, Measure, PrismaClient, Recipe, Unit } from '@prisma/client';
import { addDays, eachDayOfInterval, formatISO, subDays } from 'date-fns';

const prisma = new PrismaClient();

async function createMealtimes(): Promise<Mealtime[]> {
  return Promise.all([
    prisma.mealtime.upsert({
      where: { name: 'Breakfast' },
      create: {
        name: 'Breakfast',
        order: 1
      },
      update: {}
    }),
    prisma.mealtime.upsert({
      where: { name: 'Lunch' },
      create: {
        name: 'Lunch',
        order: 2
      },
      update: {}
    }),
    prisma.mealtime.upsert({
      where: { name: 'Dinner' },
      create: {
        name: 'Dinner',
        order: 3
      },
      update: {}
    })
  ]);
}

async function createRecipes(): Promise<Recipe[]> {
  const names = ['Porky Pie', 'Poopsicle', 'Bacalhaudding'];
  return Promise.all(
    names.map((name) =>
      prisma.recipe.upsert({
        where: {
          name: name
        },
        create: {
          name: name
        },
        update: {}
      })
    )
  );
}

async function createMeal(day: Date, mealtime: Mealtime, recipe: Recipe): Promise<Meal> {
  const date = formatISO(day, { representation: 'date' });

  return prisma.meal.upsert({
    where: {
      mealtimeId_recipeId_date: {
        date: date,
        mealtimeId: mealtime.id,
        recipeId: recipe.id
      }
    },
    create: {
      date: date,
      mealtimeId: mealtime.id,
      recipeId: recipe.id
    },
    update: {}
  });
}

async function createMeals(mealtimes: Mealtime[], recipes: Recipe[]): Promise<Meal[]> {
  const today = new Date();
  const utcToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDay());

  const days = eachDayOfInterval({
    start: subDays(utcToday, 7),
    end: addDays(utcToday, 7)
  });

  return Promise.all(
    days.flatMap((day) => {
      return mealtimes.flatMap((mealtime) => {
        return recipes.map((recipe) => {
          return createMeal(day, mealtime, recipe);
        });
      });
    })
  );
}

async function createIngredients(): Promise<Ingredient[]> {
  const ingredients = ['apple', 'banana', 'coconut'];

  return Promise.all(
    ingredients.map((ingredient) =>
      prisma.ingredient.upsert({
        where: {
          name: ingredient
        },
        create: {
          name: ingredient
        },
        update: {}
      })
    )
  );
}

async function createUnits(): Promise<Unit[]> {
  const units = ['g', 'cup', 'tbsp'];

  return Promise.all(
    units.map((unit) =>
      prisma.unit.upsert({
        where: {
          name: unit
        },
        create: {
          name: unit
        },
        update: {}
      })
    )
  );
}

async function createMeasures(
  recipes: Recipe[],
  ingredients: Ingredient[],
  units: Unit[]
): Promise<Measure[]> {
  return Promise.all(
    recipes.map((recipe, i) =>
      prisma.measure.upsert({
        where: {
          recipeId_ingredientId: {
            recipeId: recipe.id,
            ingredientId: ingredients[i].id
          }
        },
        create: {
          recipeId: recipe.id,
          unitId: units[i].id,
          ingredientId: ingredients[i].id
        },
        update: {}
      })
    )
  );
}

async function main() {
  console.log('Seeding...');
  const mealtimes = await createMealtimes();
  const recipes = await createRecipes();
  const meals = await createMeals(mealtimes, recipes);

  const ingredients = await createIngredients();
  const units = await createUnits();
  const measures = await createMeasures(recipes, ingredients, units);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

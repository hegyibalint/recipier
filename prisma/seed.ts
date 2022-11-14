import { Meal, Mealtime, PrismaClient, Recipe } from "@prisma/client";
import {
  addDays,
  addWeeks,
  eachDayOfInterval,
  isBefore,
  subDays,
  subWeeks,
} from "date-fns";

const prisma = new PrismaClient();

async function createMealtimes(): Promise<Mealtime[]> {
  return Promise.all([
    prisma.mealtime.upsert({
      where: { name: "Breakfast" },
      create: {
        name: "Breakfast",
        order: 1,
      },
      update: {},
    }),
    prisma.mealtime.upsert({
      where: { name: "Lunch" },
      create: {
        name: "Lunch",
        order: 2,
      },
      update: {},
    }),
    prisma.mealtime.upsert({
      where: { name: "Dinner" },
      create: {
        name: "Dinner",
        order: 3,
      },
      update: {},
    }),
  ]);
}

async function createRecipes(): Promise<Recipe[]> {
  const names = ["Porky Pie", "Poopsicle", "Bacalhaudding"];
  return Promise.all(
    names.map((name) =>
      prisma.recipe.upsert({
        where: {
          name: name,
        },
        create: {
          name: name,
        },
        update: {},
      })
    )
  );
}

async function createMeal(
  day: Date,
  mealtime: Mealtime,
  recipe: Recipe
): Promise<Meal> {
  return prisma.meal.upsert({
    where: {
      mealtimeId_recipeId_date: {
        date: day,
        mealtimeId: mealtime.id,
        recipeId: recipe.id,
      },
    },
    create: {
      date: day,
      mealtimeId: mealtime.id,
      recipeId: recipe.id,
    },
    update: {},
  });
}

async function createMeals(
  mealtimes: Mealtime[],
  recipes: Recipe[]
): Promise<Meal[]> {
  const today = new Date();
  const days = eachDayOfInterval({
    start: subDays(today, 7),
    end: addDays(today, 7),
  });

  console.log("Generating meals");
  return Promise.all(
    days.flatMap((day) => {
      console.log(`Creating for day ${day}`);
      return mealtimes.flatMap((mealtime) => {
        console.log(`  Creating for meal ${mealtime.name}`);
        return recipes.map((recipe) => {
          console.log(`    Creating for recipe ${recipe.name}`);
          return createMeal(day, mealtime, recipe);
        });
      });
    })
  );
}

async function main() {
  console.log("Seeding...");
  const mealtimes = await createMealtimes();
  const recipes = await createRecipes();
  const meals = await createMeals(mealtimes, recipes);
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

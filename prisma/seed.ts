import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const meals = await Promise.all([
    prisma.mealtime.upsert({
      where: { name: "Breakfast" },
      update: {},
      create: {
        name: "Breakfast",
        order: 1,
      },
    }),
    prisma.mealtime.upsert({
      where: { name: "Lunch" },
      update: {},
      create: {
        name: "Lunch",
        order: 2,
      },
    }),
    prisma.mealtime.upsert({
      where: { name: "Dinner" },
      update: {},
      create: {
        name: "Dinner",
        order: 3,
      },
    }),
  ]);
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

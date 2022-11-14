import { PrismaClient } from '@prisma/client';
import { startOfWeek } from 'date-fns';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.query['from'] === undefined) {
    return res.status(400).json({
      reason: `Parameter 'from' missing`,
    });
  }

  if (req.query['to'] === undefined) {
    return res.status(400).json({
      reason: `Parameter 'to' missing`,
    });
  }

  const fromDate = new Date(req.query['from'] as string);
  const toDate = new Date(req.query['to'] as string);

  const mealtimes = await prisma.meal.findMany();
  const meals = await prisma.meal.findMany({
    where: {
      date: {
        gte: fromDate,
        lt: toDate,
      },
    },
    select: {
      date: true,
      mealtime: true,
      recipe: true,
    },
  });

  res.status(200).json(meals);
}

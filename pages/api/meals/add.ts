import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const client = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const searchString = req.query['q'] as string;

  if (!searchString) {
    return res.status(400).json({
      err: "query parameter 'q' missing",
    });
  }

  const recipes = await client.recipe.findMany({
    where: {
      name: {
        contains: searchString,
      },
    },
  });

  return res.status(200).json(recipes);
}

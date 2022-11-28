import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const client = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const limit = req.query['l']
    ? Number.parseInt(req.query['l'] as string)
    : Number.MAX_VALUE;

  const recipes = await client.recipe.findMany({
    take: Math.min(50, limit),
  });

  return res.status(200).json(recipes);
}

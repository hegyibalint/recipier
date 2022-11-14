import { prisma } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

export interface Recipe {
  name: string;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json();
}

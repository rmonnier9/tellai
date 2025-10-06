'use server';

import prisma from '@workspace/db/prisma/client';
import getSession from '../get-session';

export async function getArticles({ productId }: { productId: string }) {
  const session = await getSession();

  if (!session) {
    return null;
  }

  // Get articles for the next 60 days from today
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 60);
  endDate.setHours(23, 59, 59, 999);

  return prisma.article.findMany({
    where: {
      productId: productId,
      scheduledDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      scheduledDate: 'asc',
    },
  });
}

export default getArticles;

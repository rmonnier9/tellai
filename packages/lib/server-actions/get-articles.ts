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
    include: {
      publications: {
        include: {
          credential: {
            select: {
              id: true,
              type: true,
              name: true,
            },
          },
        },
      },
      jobs: {
        where: {
          type: 'article_generation',
          status: {
            in: ['pending', 'running'],
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
    orderBy: {
      scheduledDate: 'asc',
    },
  });
}

export default getArticles;

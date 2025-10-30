'use server';

import prisma from '@workspace/db/prisma/client';
import getSession from '../get-session';

export async function getAllArticles({ productId }: { productId: string }) {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return prisma.article.findMany({
    where: {
      productId: productId,
      status: {
        in: ['published', 'generated'],
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
    },
    orderBy: {
      scheduledDate: 'desc',
    },
  });
}

export default getAllArticles;

'use server';

import prisma from '@workspace/db/prisma/client';
import getSession from '../get-session';

export async function getArticle({ articleId }: { articleId: string }) {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          url: true,
          logo: true,
        },
      },
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
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!article) {
    return null;
  }

  // Verify user has access through organization membership
  const hasAccess = await prisma.member.findFirst({
    where: {
      userId: session.user.id,
      organization: {
        products: {
          some: {
            id: article.product.id,
          },
        },
      },
    },
  });

  if (!hasAccess) {
    throw new Error('Unauthorized to access this article');
  }

  return article;
}

export default getArticle;

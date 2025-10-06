'use server';

import prisma from '@workspace/db/prisma/client';
import getSession from '../get-session';

export async function getArticle({ articleId }: { articleId: string }) {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      product: {
        include: {
          organization: {
            include: {
              members: {
                where: {
                  userId: session.user.id,
                },
              },
            },
          },
        },
      },
    },
  });

  // Check if user has access to this article
  if (!article || article.product.organization.members.length === 0) {
    return null;
  }

  return {
    id: article.id,
    keyword: article.keyword,
    title: article.title,
    type: article.type,
    guideSubtype: article.guideSubtype,
    listicleSubtype: article.listicleSubtype,
    searchVolume: article.searchVolume,
    keywordDifficulty: article.keywordDifficulty,
    cpc: article.cpc,
    competition: article.competition,
    scheduledDate: article.scheduledDate,
    status: article.status,
    content: article.content,
    publishedUrl: article.publishedUrl,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    product: {
      id: article.product.id,
      name: article.product.name,
      url: article.product.url,
      logo: article.product.logo,
    },
  };
}

export default getArticle;

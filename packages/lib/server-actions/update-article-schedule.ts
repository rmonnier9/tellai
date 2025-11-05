'use server';

import prisma from '@workspace/db/prisma/client';
import getSession from '../get-session';

export async function updateArticleSchedule({
  articleId,
  newDate,
  productId,
}: {
  articleId: string;
  newDate: Date;
  productId: string;
}) {
  const session = await getSession();

  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Normalize the date to start of day in UTC to avoid timezone issues
    const normalizedDate = new Date(newDate);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    // Check if the article exists and is pending
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return { success: false, error: 'Article not found' };
    }

    if (article.status !== 'pending') {
      return {
        success: false,
        error: 'Only pending articles can be rescheduled',
      };
    }

    // Check if there's already an article scheduled on the target date
    const existingArticle = await prisma.article.findFirst({
      where: {
        productId,
        scheduledDate: {
          gte: normalizedDate,
          lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000),
        },
        id: {
          not: articleId,
        },
      },
    });

    if (existingArticle) {
      // Swap the dates
      const originalDate = article.scheduledDate;

      await prisma.$transaction([
        prisma.article.update({
          where: { id: articleId },
          data: { scheduledDate: normalizedDate },
        }),
        prisma.article.update({
          where: { id: existingArticle.id },
          data: { scheduledDate: originalDate },
        }),
      ]);

      return { success: true, swapped: true };
    } else {
      // Just update the date
      await prisma.article.update({
        where: { id: articleId },
        data: { scheduledDate: normalizedDate },
      });

      return { success: true, swapped: false };
    }
  } catch (error) {
    console.error('Error updating article schedule:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default updateArticleSchedule;

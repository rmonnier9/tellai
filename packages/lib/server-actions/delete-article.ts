'use server';

import prisma from '@workspace/db/prisma/client';
import getSession from '../get-session';

export async function deleteArticle({
  articleId,
  productId,
}: {
  articleId: string;
  productId: string;
}) {
  const session = await getSession();

  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Check if the article exists and belongs to the product
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return { success: false, error: 'Article not found' };
    }

    if (article.productId !== productId) {
      return {
        success: false,
        error: 'Article does not belong to this product',
      };
    }

    // Only allow deleting pending articles
    if (article.status !== 'pending') {
      return {
        success: false,
        error: 'Only pending articles can be deleted',
      };
    }

    // Delete the article
    await prisma.article.delete({
      where: { id: articleId },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting article:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default deleteArticle;

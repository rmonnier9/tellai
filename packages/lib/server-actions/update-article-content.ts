'use server';

import prisma from '@workspace/db/prisma/client';
import { revalidatePath } from 'next/cache';
import getSession from '../get-session';

export async function updateArticleContent({
  articleId,
  content,
}: {
  articleId: string;
  content: string;
}) {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  if (!content) {
    throw new Error('Content is required');
  }

  try {
    // Verify the article belongs to a product the user has access to
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

    if (!article) {
      throw new Error('Article not found');
    }

    if (article.product.organization.members.length === 0) {
      throw new Error('Unauthorized to access this article');
    }

    // Update the article content
    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        content,
        updatedAt: new Date(),
      },
    });

    // Revalidate the article page to show updated data
    revalidatePath(`/articles/${articleId}`);

    return {
      success: true,
      article: updatedArticle,
    };
  } catch (error) {
    console.error('Error updating article:', error);
    throw new Error(
      `Failed to update article: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export default updateArticleContent;

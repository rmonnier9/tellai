'use server';

import prisma from '@workspace/db/prisma/client';
import { revalidatePath } from 'next/cache';
import getSession from '../get-session';

export async function updateArticleSettings({
  articleId,
  type,
  guideSubtype,
  listicleSubtype,
  contentLength,
}: {
  articleId: string;
  type?: 'guide' | 'listicle' | null;
  guideSubtype?: 'how_to' | 'explainer' | 'comparison' | 'reference' | null;
  listicleSubtype?: 'round_up' | 'resources' | 'examples' | null;
  contentLength?: 'short' | 'medium' | 'long' | 'comprehensive' | null;
}) {
  const session = await getSession();

  if (!session) {
    return { success: false, error: 'Unauthorized' };
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
      return { success: false, error: 'Article not found' };
    }

    if (article.product.organization.members.length === 0) {
      return { success: false, error: 'Unauthorized to access this article' };
    }

    // Only allow editing pending articles
    if (article.status !== 'pending') {
      return {
        success: false,
        error: 'Only pending articles can be edited',
      };
    }

    // Prepare update data
    const updateData: {
      type?: 'guide' | 'listicle' | null;
      guideSubtype?: 'how_to' | 'explainer' | 'comparison' | 'reference' | null;
      listicleSubtype?: 'round_up' | 'resources' | 'examples' | null;
      contentLength?: 'short' | 'medium' | 'long' | 'comprehensive' | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    // Only update fields that are provided (not undefined)
    if (type !== undefined) {
      updateData.type = type;
      // When type changes, clear the opposite subtype
      if (type === 'guide') {
        updateData.listicleSubtype = null;
      } else if (type === 'listicle') {
        updateData.guideSubtype = null;
      }
    }

    if (guideSubtype !== undefined) {
      updateData.guideSubtype = guideSubtype;
    }

    if (listicleSubtype !== undefined) {
      updateData.listicleSubtype = listicleSubtype;
    }

    if (contentLength !== undefined) {
      updateData.contentLength = contentLength;
    }

    // Update the article
    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: updateData,
    });

    // Revalidate relevant paths
    revalidatePath('/calendar');
    revalidatePath(`/articles/${articleId}`);

    return {
      success: true,
      article: updatedArticle,
    };
  } catch (error) {
    console.error('Error updating article settings:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update article settings',
    };
  }
}

export default updateArticleSettings;

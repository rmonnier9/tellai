'use server';

import prisma from '@workspace/db/prisma/client';
import { revalidatePath } from 'next/cache';
import getSession from '../get-session';
import { getPublisher } from '../publishers';

export async function publishArticle({ articleId }: { articleId: string }) {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized');
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

    if (!article.content || !article.title) {
      throw new Error('Article content must be generated before publishing');
    }

    // Get all credentials for this product
    const credentials = await prisma.credential.findMany({
      where: {
        productId: article.product.id,
      },
    });

    if (credentials.length === 0) {
      throw new Error(
        'No integrations configured. Please add an integration first.'
      );
    }

    const publications: any[] = [];
    const errors: string[] = [];

    // Publish to each credential
    for (const credential of credentials) {
      const publisher = getPublisher(credential.type);

      if (publisher) {
        const publishResult = await publisher.publish(
          {
            title: article.title,
            metaDescription: article.metaDescription!,
            content: article.content,
            keyword: article.keyword,
            imageUrl: article.featuredImageUrl!,
            createdAt: article.createdAt.toISOString(),
          },
          {
            type: credential.type,
            accessToken: credential.accessToken,
            config: credential.config,
          }
        );

        if (publishResult.success) {
          // Create publication record
          const publication = await prisma.publication.create({
            data: {
              articleId,
              credentialId: credential.id,
              url: publishResult.url,
            },
          });
          publications.push(publication);
        } else {
          errors.push(
            `${credential.name || credential.type}: ${publishResult.error}`
          );
        }
      }
    }

    // Update article status to published if at least one publication succeeded
    if (publications.length > 0) {
      await prisma.article.update({
        where: { id: articleId },
        data: { status: 'published' },
      });
    }

    // Revalidate the article page to show updated data
    revalidatePath(`/articles/${articleId}`);

    return {
      success: true,
      publicationsCount: publications.length,
      totalCredentials: credentials.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error('Error publishing article:', error);
    throw new Error(
      `Failed to publish article: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export default publishArticle;

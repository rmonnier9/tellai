'use server';

import prisma from '@workspace/db/prisma/client';
import { revalidatePath } from 'next/cache';
import getSession from '../get-session';
import { getPublisher } from '../publishers';

export async function publishToCredential({
  articleId,
  credentialId,
}: {
  articleId: string;
  credentialId: string;
}) {
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

    // Get the credential
    const credential = await prisma.credential.findUnique({
      where: { id: credentialId },
    });

    if (!credential) {
      throw new Error('Integration not found');
    }

    // Verify credential belongs to the same product
    if (credential.productId !== article.product.id) {
      throw new Error('Integration does not belong to this product');
    }

    // Get the publisher
    const publisher = getPublisher(credential.type);

    if (!publisher) {
      throw new Error(`Publisher not found for type: ${credential.type}`);
    }

    // Publish the article
    const publishResult = await publisher.publish(
      {
        title: article.title,
        content: article.content,
        metaDescription: article.metaDescription!,
        keyword: article.keyword,
        imageUrl: article.featuredImageUrl!,
        createdAt: article.createdAt.toISOString(),
        slug: article.slug!,
      },
      {
        type: credential.type,
        accessToken: credential.accessToken,
        config: credential.config,
      }
    );

    if (!publishResult.success) {
      throw new Error(publishResult.error || 'Failed to publish');
    }

    // Create publication record
    const publication = await prisma.publication.create({
      data: {
        articleId,
        credentialId,
        url: publishResult.url,
      },
    });

    // Update article status to published if it was generated
    if (article.status === 'generated') {
      await prisma.article.update({
        where: { id: articleId },
        data: { status: 'published' },
      });
    }

    // Revalidate the article page to show updated data
    revalidatePath(`/articles/${articleId}`);

    return {
      success: true,
      publication,
      url: publishResult.url,
    };
  } catch (error) {
    console.error('Error publishing to credential:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to publish'
    );
  }
}

export default publishToCredential;

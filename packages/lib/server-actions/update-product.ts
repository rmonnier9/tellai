'use server';

import { auth } from '@workspace/auth/server';
import { headers } from 'next/headers';
import prisma from '@workspace/db/prisma/client';
import { UpdateProductSchema } from '../dtos';

export async function updateProduct(
  productId: string,
  data: UpdateProductSchema
) {
  try {
    // Get the current session directly using better-auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return {
        success: false,
        error: 'Unauthorized - no session found',
      };
    }

    // Validate that the user has access to this product
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        organization: {
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
    });

    if (!existingProduct) {
      return {
        success: false,
        error: 'Product not found or access denied',
      };
    }

    // Validate the data
    const validatedData = UpdateProductSchema.parse(data);

    // Update the product in the database
    const product = await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        language: validatedData.language,
        country: validatedData.country,
        logo: validatedData.logo || null,
        targetAudiences: validatedData.targetAudiences,
        sitemapUrl: validatedData.sitemapUrl || null,
        blogUrl: validatedData.blogUrl || null,
        bestArticles: validatedData.bestArticles || [],
        // Article preferences
        autoPublish: validatedData.autoPublish,
        articleStyle: validatedData.articleStyle,
        internalLinks: validatedData.internalLinks,
        globalInstructions: validatedData.globalInstructions || null,
        imageStyle: validatedData.imageStyle,
        brandColor: validatedData.brandColor,
        includeYoutubeVideo: validatedData.includeYoutubeVideo,
        includeCallToAction: validatedData.includeCallToAction,
        includeInfographics: validatedData.includeInfographics,
        includeEmojis: validatedData.includeEmojis,
      },
    });

    return { success: true, product };
  } catch (error) {
    console.error('Error updating product:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update product',
    };
  }
}

export default updateProduct;

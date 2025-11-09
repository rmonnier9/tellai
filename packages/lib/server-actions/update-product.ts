'use server';

import { auth } from '@workspace/auth/server';
import prisma from '@workspace/db/prisma/client';
import { headers } from 'next/headers';
import { UpdateProductSchema } from '../dtos';
import { detectLinksFromSitemap } from './detect-links';

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

    // Check if sitemap URL has changed
    const sitemapUrlChanged =
      validatedData.sitemapUrl !== existingProduct.sitemapUrl;

    // Get subscription status to check if user can remove watermark
    const productWithSubscription = await prisma.product.findUnique({
      where: { id: productId },
      include: { subscription: true },
    });

    // Only allow removeWatermark if subscription is active (not trialing)
    const canRemoveWatermark =
      productWithSubscription?.subscription?.status === 'active';

    const removeWatermark =
      canRemoveWatermark && (validatedData.removeWatermark ?? false);

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
        competitors: validatedData.competitors || [],
        sitemapUrl: validatedData.sitemapUrl || null,
        blogUrl: validatedData.blogUrl || null,
        bestArticles: validatedData.bestArticles || [],
        // Update link source if sitemap URL is provided
        linkSource: validatedData.sitemapUrl ? 'sitemap' : 'database',
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
        removeWatermark: removeWatermark,
      },
    });

    // If sitemap URL changed and is not empty, detect links in the background
    if (sitemapUrlChanged && validatedData.sitemapUrl) {
      // Run link detection asynchronously - don't block product update if it fails
      detectLinksFromSitemap(productId, validatedData.sitemapUrl)
        .then((result) => {
          if (result.success) {
            console.log(
              `✅ Successfully detected ${result.totalUrls} links from updated sitemap`
            );
          } else {
            console.warn(
              `⚠️ Failed to detect links from updated sitemap: ${result.error}`
            );
          }
        })
        .catch((error) => {
          console.error(
            '⚠️ Error detecting links from updated sitemap:',
            error
          );
        });
    }

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

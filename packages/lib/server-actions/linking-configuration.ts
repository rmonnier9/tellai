'use server';

import prisma from '@workspace/db/prisma/client';
import getSession from '../get-session';

export async function saveLinkingConfiguration(
  productId: string,
  linkSource: 'database' | 'sitemap',
  sitemapUrl?: string
) {
  try {
    const session = await getSession();
    if (!session) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    if (!productId || !linkSource) {
      return {
        success: false,
        error: 'Product ID and link source are required',
      };
    }

    if (linkSource === 'sitemap' && !sitemapUrl) {
      return {
        success: false,
        error: 'Sitemap URL is required when using sitemap as link source',
      };
    }

    // Verify the product belongs to the user's organization
    const product = await prisma.product.findFirst({
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

    if (!product) {
      return {
        success: false,
        error: 'Product not found or access denied',
      };
    }

    // Update product linking configuration
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        linkSource,
        sitemapUrl: linkSource === 'sitemap' ? sitemapUrl : product.sitemapUrl,
      },
    });

    return {
      success: true,
      product: updatedProduct,
    };
  } catch (error) {
    console.error('Error updating linking configuration:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update linking configuration',
    };
  }
}

export async function getLinkingConfiguration(productId: string) {
  try {
    const session = await getSession();
    if (!session) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    if (!productId) {
      return {
        success: false,
        error: 'Product ID is required',
      };
    }

    // Fetch product linking configuration
    const product = await prisma.product.findFirst({
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
      select: {
        id: true,
        linkSource: true,
        sitemapUrl: true,
        detectedLinks: true,
      },
    });

    if (!product) {
      return {
        success: false,
        error: 'Product not found or access denied',
      };
    }

    return {
      success: true,
      product,
    };
  } catch (error) {
    console.error('Error fetching linking configuration:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch linking configuration',
    };
  }
}

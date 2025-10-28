'use server';

import prisma from '@workspace/db/prisma/client';
import { enqueueJob } from '../enqueue-job';
import getSession from '../get-session';

const ADMIN_IDS =
  process.env.ADMIN_IDS?.split(',').map((id) => id.trim()) || [];

/**
 * Admin-only action to delete all pending articles and trigger keyword regeneration
 * @param productId - The ID of the product to reset
 */
export async function resetAndRegenerateKeywords(productId: string) {
  try {
    const session = await getSession();

    console.log('Admin access required', session);
    if (!session?.session) {
      return {
        success: false,
        error: 'Unauthorized - no session found',
      };
    }

    // Check if user is an admin
    if (!ADMIN_IDS.includes(session.user.id)) {
      return {
        success: false,
        error: 'Forbidden - Admin access required',
      };
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return {
        success: false,
        error: 'Product not found',
      };
    }

    // Count pending articles before deletion
    const pendingCount = await prisma.article.count({
      where: {
        productId,
        status: 'pending',
      },
    });

    // Delete all pending articles
    const deleteResult = await prisma.article.deleteMany({
      where: {
        productId,
        status: 'pending',
      },
    });

    // Trigger keyword generation
    const jobId = await enqueueJob({
      jobType: 'content_planner',
      productId,
    });

    return {
      success: true,
      deletedCount: deleteResult.count,
      jobId,
      message: `Deleted ${deleteResult.count} pending articles and triggered keyword regeneration`,
    };
  } catch (error) {
    console.error('Error resetting and regenerating keywords:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default resetAndRegenerateKeywords;

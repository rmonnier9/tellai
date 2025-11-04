'use server';

import prisma from '@workspace/db/prisma/client';
import { revalidatePath } from 'next/cache';
import { enqueueJob } from '../../enqueue-job';
import getSession from '../../get-session';

const ADMIN_IDS =
  process.env.ADMIN_IDS?.split(',').map((id) => id.trim()) || [];

type GenerateArticleAdminInput = {
  articleId: string;
};

type GenerateArticleAdminResult = {
  success: boolean;
  error?: string;
  articleId?: string;
  jobId?: string;
};

/**
 * Admin-only function to start generating an existing article
 */
export async function generateArticleAdmin(
  input: GenerateArticleAdminInput
): Promise<GenerateArticleAdminResult> {
  try {
    const session = await getSession();

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

    const { articleId } = input;

    if (!articleId) {
      return { success: false, error: 'Article ID is required' };
    }

    // Validate article exists and get product ID
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        product: true,
      },
    });

    if (!article) {
      return { success: false, error: 'Article not found' };
    }

    // Check if article is already generated or published
    if (article.status === 'generated' || article.status === 'published') {
      return {
        success: false,
        error: `Article is already ${article.status}. Cannot regenerate.`,
      };
    }

    // Check if there's already a pending or running job for this article
    const existingJob = await prisma.job.findFirst({
      where: {
        articleId,
        type: 'article_generation',
        status: {
          in: ['pending', 'running'],
        },
      },
    });

    if (existingJob) {
      return {
        success: false,
        error: 'Article generation is already in progress for this article',
        articleId,
        jobId: existingJob.id,
      };
    }

    // Enqueue article generation job
    const jobId = await enqueueJob({
      jobType: 'article_generation',
      articleId: article.id,
      productId: article.productId,
    });

    if (!jobId) {
      return {
        success: false,
        error: 'Failed to enqueue article generation job',
        articleId: article.id,
      };
    }

    // Revalidate relevant paths
    revalidatePath('/calendar');
    revalidatePath('/admin');

    return {
      success: true,
      articleId: article.id,
      jobId,
    };
  } catch (error) {
    console.error('Error generating article:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to generate article',
    };
  }
}

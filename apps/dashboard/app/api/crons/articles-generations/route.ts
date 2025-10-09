import { NextRequest, NextResponse } from 'next/server';
import prisma from '@workspace/db/prisma/client';
import { enqueueJob } from '@workspace/lib/enqueue-job';
import pMap from 'p-map';

/**
 * Cron handler to process scheduled articles for the current day
 * Fetches all pending articles scheduled for today that are linked to products
 * with an active subscription or trial, and enqueues generation jobs for them.
 */
export async function GET(request: NextRequest) {
  try {
    // Authorization check - verify cron secret
    // const authHeader = request.headers.get('authorization');
    // const cronSecret = process.env.CRON_SECRET;

    // if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Get today's date range (start and end of day in UTC)
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Fetch all pending articles scheduled for today with active subscriptions
    const articles = await prisma.article.findMany({
      where: {
        status: 'pending',
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        product: {
          subscription: {
            OR: [
              {
                // Active subscription
                status: 'active',
                periodStart: {
                  lte: today,
                },
                periodEnd: {
                  gte: today,
                },
              },
              {
                // Active trial
                trialStart: {
                  lte: today,
                },
                trialEnd: {
                  gte: today,
                },
              },
            ],
          },
        },
      },
      include: {
        product: {
          include: {
            subscription: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });

    console.log(
      `[Cron] Found ${articles.length} articles to process for ${today.toISOString()}`
    );

    // Process articles concurrently with p-map (limit concurrency to avoid overload)
    const results = await pMap(
      articles,
      async (article) => {
        try {
          const jobId = await enqueueJob({
            jobType: 'article_generation',
            articleId: article.id,
            productId: article.productId,
          });

          console.log(
            `[Cron] Enqueued job ${jobId} for article ${article.id} (${article.keyword})`
          );

          return {
            success: true,
            articleId: article.id,
            keyword: article.keyword,
            jobId,
          };
        } catch (error) {
          console.error(
            `[Cron] Failed to enqueue job for article ${article.id}:`,
            error
          );

          return {
            success: false,
            articleId: article.id,
            keyword: article.keyword,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
      {
        concurrency: 100,
      }
    );

    // Separate successful and failed results
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    const response = {
      success: true,
      timestamp: today.toISOString(),
      summary: {
        total: articles.length,
        successful: successful.length,
        failed: failed.length,
      },
      results: {
        successful: successful.map((r) => ({
          articleId: r.articleId,
          keyword: r.keyword,
          jobId: r.jobId,
        })),
        ...(failed.length > 0 && {
          failed: failed.map((r) => ({
            articleId: r.articleId,
            keyword: r.keyword,
            error: r.error,
          })),
        }),
      },
    };

    console.log(
      `[Cron] Completed processing. Success: ${successful.length}, Failed: ${failed.length}`
    );

    return NextResponse.json(response, {
      status: failed.length > 0 ? 207 : 200, // 207 Multi-Status if there are any failures
    });
  } catch (error) {
    console.error('[Cron] Fatal error processing scheduled articles:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process scheduled articles',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

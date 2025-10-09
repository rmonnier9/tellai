import { NextRequest, NextResponse } from 'next/server';
import prisma from '@workspace/db/prisma/client';
import { enqueueJob } from '@workspace/lib/enqueue-job';
import pMap from 'p-map';

/**
 * Cron handler to trigger content planning for products
 * Fetches all products with active subscriptions that have no pending articles
 * and enqueues content planner jobs to generate new article ideas for them.
 */
export async function GET(request: NextRequest) {
  try {
    // Authorization check - verify cron secret
    // const authHeader = request.headers.get('authorization');
    // const cronSecret = process.env.CRON_SECRET;

    // if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const today = new Date();

    // Fetch all products with active subscriptions that have no pending articles
    const products = await prisma.product.findMany({
      where: {
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
        // No pending articles
        articles: {
          none: {
            status: 'pending',
          },
        },
      },
      include: {
        subscription: true,
        _count: {
          select: {
            articles: {
              where: {
                status: 'pending',
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(
      `[Cron] Found ${products.length} products with no pending articles to plan content for`
    );

    // Process products concurrently with p-map
    const results = await pMap(
      products,
      async (product) => {
        try {
          const jobId = await enqueueJob({
            jobType: 'content_planner',
            productId: product.id,
          });

          console.log(
            `[Cron] Enqueued content planner job ${jobId} for product ${product.id} (${product.name})`
          );

          return {
            success: true,
            productId: product.id,
            productName: product.name,
            jobId,
          };
        } catch (error) {
          console.error(
            `[Cron] Failed to enqueue content planner job for product ${product.id}:`,
            error
          );

          return {
            success: false,
            productId: product.id,
            productName: product.name,
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
        total: products.length,
        successful: successful.length,
        failed: failed.length,
      },
      results: {
        successful: successful.map((r) => ({
          productId: r.productId,
          productName: r.productName,
          jobId: r.jobId,
        })),
        ...(failed.length > 0 && {
          failed: failed.map((r) => ({
            productId: r.productId,
            productName: r.productName,
            error: r.error,
          })),
        }),
      },
    };

    console.log(
      `[Cron] Completed content planning. Success: ${successful.length}, Failed: ${failed.length}`
    );

    return NextResponse.json(response, {
      status: failed.length > 0 ? 207 : 200, // 207 Multi-Status if there are any failures
    });
  } catch (error) {
    console.error('[Cron] Fatal error processing content planning:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process content planning',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

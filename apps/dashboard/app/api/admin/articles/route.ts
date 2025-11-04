import { auth } from '@workspace/auth/server';
import prisma from '@workspace/db/prisma/client';
import { NextResponse } from 'next/server';

const ADMIN_IDS =
  process.env.ADMIN_IDS?.split(',').map((id) => id.trim()) || [];

/**
 * Admin endpoint to list articles for a product
 * GET /api/admin/articles?productId=xxx
 */
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is an admin
    if (!ADMIN_IDS.includes(session.user.id)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Fetch articles for the product
    const articles = await prisma.article.findMany({
      where: {
        productId,
      },
      include: {
        jobs: {
          where: {
            type: 'article_generation',
            status: {
              in: ['pending', 'running'],
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        scheduledDate: 'desc',
      },
      take: 100, // Limit to 100 most recent articles
    });

    return NextResponse.json({ articles });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

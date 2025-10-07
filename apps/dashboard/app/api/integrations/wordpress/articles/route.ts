import { NextRequest, NextResponse } from 'next/server';
import prisma from '@workspace/db/prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Get API key from headers
    const apiKey = request.headers.get('X-API-Key');

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 401 });
    }

    // Find credential with this API key
    const credential = await prisma.credential.findFirst({
      where: {
        accessToken: apiKey,
        type: 'wordpress',
      },
      include: {
        product: true,
      },
    });

    if (!credential) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 403 });
    }

    // Get articles for this product that are ready to publish
    // Only get articles that have been generated and not yet published to this credential
    const articles = await prisma.article.findMany({
      where: {
        productId: credential.productId!,
        status: 'generated',
        content: {
          not: null,
        },
        title: {
          not: null,
        },
        // Only get articles that haven't been published to this credential yet
        publications: {
          none: {
            credentialId: credential.id,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to 50 articles per request
    });

    // Transform articles to the format expected by WordPress plugin
    const transformedArticles = articles.map((article) => {
      // Generate slug from title if not available
      const slug = article.title
        ? article.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
        : article.keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      return {
        slug,
        title: article.title || article.keyword,
        content: article.content || '',
        meta_description: article.content
          ? article.content.substring(0, 160).replace(/\n/g, ' ')
          : '',
        image_url: undefined, // Can be extended to support featured images
        category: undefined, // Can be extended to support category mapping
        tags: [article.keyword], // Use keyword as tag
        author: undefined, // Can be extended to support author mapping
        created_at: article.createdAt.toISOString(),
        focus_keyword: article.keyword,
      };
    });

    return NextResponse.json({
      data: {
        articles: transformedArticles,
      },
    });
  } catch (error) {
    console.error('WordPress articles API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import prisma from '@workspace/db/prisma/client';
import { NextRequest, NextResponse } from 'next/server';

// CORS headers for Framer
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://framer.com/',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    // Get API key from headers
    const apiKey = request.headers.get('X-API-Key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Find credential with this API key
    const credential = await prisma.credential.findFirst({
      where: {
        accessToken: apiKey,
        type: 'framer',
      },
      include: {
        product: true,
      },
    });

    if (!credential) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Get articles for this product that are ready to publish
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

    // Transform articles to the format expected by Framer plugin
    const transformedArticles = articles.map((article) => {
      return {
        Title: article.title || article.keyword,
        'Meta Description':
          article.metaDescription ||
          (article.content
            ? article.content.substring(0, 160).replace(/\n/g, ' ')
            : ''),
        Content: article.content || '',
        Image: article.featuredImageUrl || '',
        CreatedAt: article.createdAt.toISOString().split('T')[0], // Format as YYYY-MM-DD
        Status: article.status === 'generated' ? 'Published' : 'Draft',
        Slug: article.title
          ? article.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '')
          : article.keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          articles: transformedArticles,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Framer articles API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

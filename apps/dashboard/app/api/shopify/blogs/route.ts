import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.headers.get('x-shopify-access-token');
    const storeName = request.headers.get('x-shopify-store-name');

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Missing Shopify access token' },
        { status: 401 }
      );
    }

    if (!storeName) {
      return NextResponse.json(
        { error: 'Missing Shopify store name' },
        { status: 400 }
      );
    }

    // Sanitize store name
    const sanitizedStoreName = storeName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    if (!sanitizedStoreName) {
      return NextResponse.json(
        { error: 'Invalid store name' },
        { status: 400 }
      );
    }

    // Shopify Admin API REST endpoint
    const endpoint = `https://${sanitizedStoreName}.myshopify.com/admin/api/2024-01/blogs.json`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error:
            errorData.message || errorData.errors || 'Failed to fetch blogs',
          status: response.status,
          details: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform the REST response to a simpler format
    const blogs =
      data.blogs?.map(
        (blog: { id: number; title: string; handle: string }) => ({
          id: `gid://shopify/Blog/${blog.id}`,
          title: blog.title,
          handle: blog.handle,
          numericId: blog.id.toString(),
        })
      ) || [];

    return NextResponse.json({
      success: true,
      blogs,
    });
  } catch (error) {
    console.error('Error fetching Shopify blogs:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

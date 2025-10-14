import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    const accessToken = request.headers.get('x-webflow-token');

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Missing Webflow API token' },
        { status: 401 }
      );
    }

    if (!siteId) {
      return NextResponse.json({ error: 'Missing site ID' }, { status: 400 });
    }

    // Call Webflow API to list collections for a site
    const response = await fetch(
      `https://api.webflow.com/v2/sites/${siteId}/collections`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'accept-version': '1.0.0',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error:
            errorData.message || errorData.err || 'Failed to fetch collections',
          status: response.status,
          details: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      collections: data.collections || [],
    });
  } catch (error) {
    console.error('Error fetching Webflow collections:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

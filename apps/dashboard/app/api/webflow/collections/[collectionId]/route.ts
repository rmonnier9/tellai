import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  try {
    const { collectionId } = await params;
    const accessToken = request.headers.get('x-webflow-token');

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Missing Webflow API token' },
        { status: 401 }
      );
    }

    if (!collectionId) {
      return NextResponse.json(
        { error: 'Missing collection ID' },
        { status: 400 }
      );
    }

    // Call Webflow API server-side to avoid CORS issues
    const response = await fetch(
      `https://api.webflow.com/v2/collections/${collectionId}`,
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
            errorData.message || errorData.err || 'Failed to fetch collection',
          status: response.status,
          details: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      collection: data,
      fields: data.fields || [],
    });
  } catch (error) {
    console.error('Error fetching Webflow collection:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

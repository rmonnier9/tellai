import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.headers.get('x-webflow-token');

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Missing Webflow API token' },
        { status: 401 }
      );
    }

    // Call Webflow API to list sites
    const response = await fetch('https://api.webflow.com/v2/sites', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'accept-version': '1.0.0',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: errorData.message || errorData.err || 'Failed to fetch sites',
          status: response.status,
          details: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      sites: data.sites || [],
    });
  } catch (error) {
    console.error('Error fetching Webflow sites:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

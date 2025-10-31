'use server';

import prisma from '@workspace/db/prisma/client';
import { XMLParser } from 'fast-xml-parser';
import getSession from '../get-session';

interface DetectedLink {
  url: string;
  title?: string;
  keyword?: string;
}

async function fetchSitemap(url: string): Promise<string[]> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
  }

  const xml = await response.text();
  const parser = new XMLParser();
  const result = parser.parse(xml);

  const urls: string[] = [];

  // Handle sitemap index (contains other sitemaps)
  if (result.sitemapindex?.sitemap) {
    const sitemaps = Array.isArray(result.sitemapindex.sitemap)
      ? result.sitemapindex.sitemap
      : [result.sitemapindex.sitemap];

    for (const sitemap of sitemaps) {
      const sitemapUrl = sitemap.loc;
      if (sitemapUrl) {
        const nestedUrls = await fetchSitemap(sitemapUrl);
        urls.push(...nestedUrls);
      }
    }
  }

  // Handle regular sitemap with URLs
  if (result.urlset?.url) {
    const urlEntries = Array.isArray(result.urlset.url)
      ? result.urlset.url
      : [result.urlset.url];

    for (const entry of urlEntries) {
      if (entry.loc) {
        urls.push(entry.loc);
      }
    }
  }

  return urls;
}

async function extractTitleFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkDetector/1.0)',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      return extractTitleFromPath(url);
    }

    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

    if (titleMatch && titleMatch[1]) {
      return titleMatch[1].trim();
    }

    return extractTitleFromPath(url);
  } catch {
    // If we can't fetch the page, generate title from URL
    return extractTitleFromPath(url);
  }
}

function extractTitleFromPath(url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;

    // Remove leading/trailing slashes and get the last segment
    const segments = path.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1] || 'Home';

    // Convert URL slug to title format
    return lastSegment
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  } catch {
    return 'Untitled';
  }
}

export async function detectLinksFromSitemap(
  productId: string,
  sitemapUrl: string
) {
  try {
    const session = await getSession();
    if (!session) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    if (!productId || !sitemapUrl) {
      return {
        success: false,
        error: 'Product ID and sitemap URL are required',
      };
    }

    // Verify the product belongs to the user's organization
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        organization: {
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
    });

    if (!product) {
      return {
        success: false,
        error: 'Product not found or access denied',
      };
    }

    // Fetch and parse sitemap
    const urls = await fetchSitemap(sitemapUrl);

    // Extract titles for a sample of URLs (limit to prevent too many requests)
    const detectedLinks: DetectedLink[] = await Promise.all(
      urls.slice(0, 100).map(async (url) => {
        const title = await extractTitleFromUrl(url);
        return {
          url,
          title,
          keyword: '', // Could be enhanced with keyword extraction
        };
      })
    );

    // Update product with detected links
    await prisma.product.update({
      where: { id: productId },
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        detectedLinks: detectedLinks as any,
        totalUrlsDetected: urls.length,
      },
    });

    return {
      success: true,
      links: detectedLinks,
      totalUrls: urls.length,
    };
  } catch (error) {
    console.error('Error detecting links:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to detect links from sitemap',
    };
  }
}

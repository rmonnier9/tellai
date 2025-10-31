import { openai } from '@ai-sdk/openai';
import prisma from '@workspace/db/prisma/client';
import type { Prisma } from '@workspace/db/prisma/generated/client';
import type { CoreMessage } from 'ai';
import { generateText } from 'ai';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { NextRequest, NextResponse } from 'next/server';

interface BlogIdea {
  title: string;
  keyword: string;
  description: string;
}

interface PageData {
  title: string;
  metaDescription: string;
  h1: string;
  bodyText: string;
  language: string;
}

// Extract content from a single page
async function extractPageContent(url: string): Promise<PageData | null> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 10000,
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data);

    // Remove script, style, nav, footer, header
    $('script, style, nav, footer, header, aside').remove();

    const title = $('title').first().text().trim();
    const metaDescription =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      '';
    const h1 = $('h1').first().text().trim();

    // Extract body text from paragraphs (first 5 paragraphs)
    const bodyText = $('p')
      .slice(0, 5)
      .map((_, el) => $(el).text().trim())
      .get()
      .join(' ')
      .substring(0, 1000); // Limit to 1000 chars

    const language = $('html').attr('lang') || 'en';

    return {
      title,
      metaDescription,
      h1,
      bodyText,
      language,
    };
  } catch (error) {
    console.error(`Error extracting content from ${url}:`, error);
    return null;
  }
}

// Find sitemap and extract URLs
async function findSitemapUrls(baseUrl: string): Promise<string[]> {
  const urlObj = new URL(baseUrl);
  const commonSitemaps = [
    '/sitemap.xml',
    '/sitemap_index.xml',
    '/sitemap',
    '/blog/sitemap.xml',
    '/sitemaps/sitemap.xml',
  ];

  for (const path of commonSitemaps) {
    try {
      const sitemapUrl = `${urlObj.protocol}//${urlObj.host}${path}`;
      const response = await axios.get(sitemapUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 5000,
      });

      const $ = cheerio.load(response.data, { xmlMode: true });
      const urls: string[] = [];

      // Extract URLs from sitemap
      $('url loc').each((_, el) => {
        const url = $(el).text().trim();
        if (url && url.startsWith('http')) {
          urls.push(url);
        }
      });

      // Also check for sitemap index
      $('sitemap loc').each((_, el) => {
        const url = $(el).text().trim();
        if (url && url.startsWith('http')) {
          urls.push(url);
        }
      });

      if (urls.length > 0) {
        // Return homepage + blog URLs + up to 8 more pages
        const homepage =
          urls.find((u) => {
            const uObj = new URL(u);
            return uObj.pathname === '/' || uObj.pathname === '';
          }) || baseUrl;

        const blogUrls = urls
          .filter((u) => {
            const uObj = new URL(u);
            return (
              uObj.pathname.includes('/blog') || uObj.pathname.includes('/post')
            );
          })
          .slice(0, 3);

        const otherUrls = urls
          .filter((u) => u !== homepage && !blogUrls.includes(u))
          .slice(0, 6);

        return [homepage, ...blogUrls, ...otherUrls]
          .filter(Boolean)
          .slice(0, 10);
      }
    } catch {
      // Continue to next sitemap location
      continue;
    }
  }

  // If no sitemap found, return just homepage and common blog paths
  return [
    baseUrl,
    `${urlObj.protocol}//${urlObj.host}/blog`,
    `${urlObj.protocol}//${urlObj.host}/about`,
    `${urlObj.protocol}//${urlObj.host}/products`,
    `${urlObj.protocol}//${urlObj.host}/services`,
  ].filter(Boolean);
}

// Generate blog ideas using AI
async function generateBlogIdeas(
  websiteSummary: string,
  language: string = 'en'
): Promise<BlogIdea[]> {
  try {
    const prompt: CoreMessage = {
      role: 'user',
      content: `You are an SEO content strategist.

Based on this website description: 
"${websiteSummary}"

Generate 10 blog article ideas that:
- target long-tail keywords
- are relevant to the website's audience
- have high SEO potential
- are coherent with the site's themes
${language !== 'en' ? `- All ideas must be in ${language.toUpperCase()} language` : ''}

Return ONLY a valid JSON array in this exact format (no markdown, no code blocks):
[
  {"title": "Article title", "keyword": "main keyword phrase", "description": "Brief description of the article"}
]

Make sure the JSON is valid and properly formatted.`,
    };

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      temperature: 0.7,
      maxOutputTokens: 1500,
      messages: [prompt],
    });

    // Parse JSON from response (handle markdown code blocks if present)
    let jsonText = text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');
    }

    const ideas = JSON.parse(jsonText) as BlogIdea[];

    // Ensure we have exactly 10 ideas
    if (!Array.isArray(ideas) || ideas.length === 0) {
      throw new Error('Invalid response format from AI');
    }

    return ideas.slice(0, 10);
  } catch (error) {
    console.error('Error generating blog ideas:', error);
    throw new Error('Failed to generate blog ideas');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    let baseUrl: string;
    try {
      const urlObj = new URL(url);
      // Normalize baseUrl (remove trailing slash, lowercase host)
      baseUrl = `${urlObj.protocol}//${urlObj.host.toLowerCase()}`.replace(
        /\/$/,
        ''
      );
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Check cache for existing analysis
    try {
      const cachedAnalysis = await prisma.blogTopicFinderAnalysis.findFirst({
        where: {
          baseUrl,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (cachedAnalysis && cachedAnalysis.ideas) {
        const cachedIdeas = cachedAnalysis.ideas as unknown as BlogIdea[];
        console.log(`Returning cached ideas for ${baseUrl}`);
        return NextResponse.json({ ideas: cachedIdeas, cached: true });
      }
    } catch (cacheError) {
      // Log error but continue with normal flow if cache check fails
      console.error('Error checking cache:', cacheError);
    }

    // Find URLs to analyze
    const urlsToAnalyze = await findSitemapUrls(baseUrl);

    // Extract content from pages (limit to 10 pages)
    const pageContents: PageData[] = [];
    for (const pageUrl of urlsToAnalyze.slice(0, 10)) {
      const content = await extractPageContent(pageUrl);
      if (content) {
        pageContents.push(content);
      }
      // Add small delay to be respectful
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (pageContents.length === 0) {
      return NextResponse.json(
        { error: 'Could not extract any content from the website' },
        { status: 500 }
      );
    }

    // Create website summary
    const allTitles = pageContents.map((p) => p.title).join('. ');
    const allDescriptions = pageContents
      .map((p) => p.metaDescription)
      .filter(Boolean)
      .join('. ');
    const allH1s = pageContents
      .map((p) => p.h1)
      .filter(Boolean)
      .join('. ');
    const allBodyText = pageContents
      .map((p) => p.bodyText)
      .filter(Boolean)
      .join(' ')
      .substring(0, 2000); // Limit total text

    const websiteSummary = `Website focuses on:
Titles: ${allTitles}
Descriptions: ${allDescriptions}
Main headings: ${allH1s}
Content: ${allBodyText}`;

    const primaryLanguage = pageContents[0]?.language || 'en';

    // Generate blog ideas
    const ideas = await generateBlogIdeas(websiteSummary, primaryLanguage);

    // Save URLs and ideas to database
    try {
      await prisma.blogTopicFinderAnalysis.create({
        data: {
          baseUrl,
          analyzedUrls: urlsToAnalyze,
          ideas: ideas as unknown as Prisma.InputJsonValue,
        },
      });
      console.log(`Saved analysis with ${ideas.length} ideas to database`);
    } catch (dbError) {
      // Log error but don't fail the request if DB save fails
      console.error('Error saving URLs and ideas to database:', dbError);
    }

    return NextResponse.json({ ideas });
  } catch (error) {
    console.error('Error in blog-topic-finder API:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An error occurred while generating blog ideas',
      },
      { status: 500 }
    );
  }
}

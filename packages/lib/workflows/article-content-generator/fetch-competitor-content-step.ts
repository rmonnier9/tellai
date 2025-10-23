import { createStep } from '@mastra/core/workflows';
import axios from 'axios';
import * as cheerio from 'cheerio';

import { WorkflowDTO } from './schemas';

// Step 3: Fetch and Parse Top Competitors' Content
const fetchCompetitorContentStep = createStep({
  id: 'fetch-competitor-content',
  inputSchema: WorkflowDTO,
  outputSchema: WorkflowDTO,
  execute: async ({ inputData }) => {
    const { serpResults } = inputData;

    if (!serpResults || serpResults.length === 0) {
      return {
        ...inputData,
        competitorContent: [],
      };
    }

    const competitorContent = [];

    // Fetch and parse each competitor's page
    for (const result of serpResults) {
      try {
        let htmlContent: string | undefined = result.html;

        // If DataForSEO didn't provide HTML, fetch it with axios
        if (!htmlContent) {
          console.log(
            `HTML not available from DataForSEO for ${result.url}, fetching with axios...`
          );

          try {
            const response = await axios.get(result.url, {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              },
              timeout: 10000,
              maxRedirects: 5,
            });
            htmlContent = response.data;
          } catch (axiosError) {
            console.error(
              `Failed to fetch content from ${result.url} with axios:`,
              axiosError instanceof Error ? axiosError.message : 'Unknown error'
            );
            // Continue to next competitor instead of failing
            continue;
          }
        } else {
          console.log(`Using HTML content from DataForSEO for ${result.url}`);
        }

        // Ensure we have HTML content before parsing
        if (!htmlContent) {
          console.error(
            `No HTML content available for ${result.url}, skipping...`
          );
          continue;
        }

        // Parse the HTML content
        const $ = cheerio.load(htmlContent);

        // Remove script, style, and nav elements
        $('script, style, nav, footer, header').remove();

        // Extract headings
        const headings: string[] = [];
        $('h1, h2, h3, h4').each((_, el) => {
          const text = $(el).text().trim();
          if (text) headings.push(text);
        });

        // Extract meta description
        const metaDescription =
          $('meta[name="description"]').attr('content') ||
          $('meta[property="og:description"]').attr('content') ||
          '';

        // Extract main content text
        const bodyText = $('body').text();
        const words = bodyText.split(/\s+/).filter((w) => w.length > 0);
        const wordCount = words.length;

        // Get content preview (first 1000 characters of cleaned text)
        const contentPreview = bodyText
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 1000);

        competitorContent.push({
          url: result.url,
          title: result.title,
          metaDescription,
          headings,
          wordCount,
          contentPreview,
        });
      } catch (error) {
        console.error(
          `Error parsing competitor content from ${result.url}:`,
          error instanceof Error ? error.message : 'Unknown error'
        );
        // Continue with other results - workflow should not fail
      }
    }

    // Log summary
    console.log(
      `Successfully analyzed ${competitorContent.length} out of ${serpResults.length} competitor pages`
    );

    return {
      ...inputData,
      competitorContent,
    };
  },
});

export default fetchCompetitorContentStep;

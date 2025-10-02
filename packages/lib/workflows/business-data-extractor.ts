import { createWorkflow, createStep } from '@mastra/core/workflows';
import { Agent } from '@mastra/core/agent';
import { z } from 'zod';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { openai } from '@ai-sdk/openai';

// Business data extraction agent
const businessAnalyzer = new Agent({
  name: 'Business Analyzer',
  instructions: `You are an expert business analyst. Extract structured business information from webpage content accurately and concisely.`,
  model: openai('gpt-4o-mini'),
});

// Final output schema
const outputSchema = z.object({
  url: z.string(),
  logo: z.string().describe('base64 image of the business logo or favicon'),
  name: z.string().describe('business or product name'),
  language: z.string().describe('ISO language code'),
  country: z.string().describe('country code'),
  description: z
    .string()
    .describe('detailed description of what the business or product does'),
  targetAudiences: z
    .array(z.string())
    .describe('list of potential target audiences'),
});

// Step 1: Fetch and parse HTML
const fetchPageStep = createStep({
  id: 'fetch-page',
  inputSchema: z.object({
    url: z.string().url(),
  }),
  outputSchema: z.object({
    url: z.string(),
    rawData: z.object({
      title: z.string(),
      metaDescription: z.string(),
      metaSiteName: z.string(),
      language: z.string(),
      favicon: z.string(),
      ogImage: z.string(),
      h1: z.string(),
      h2: z.string(),
      bodyText: z.string(),
    }),
  }),
  execute: async ({ inputData }) => {
    const { url } = inputData;

    try {
      // Fetch the webpage
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);

      // Extract basic information
      const rawData = {
        title: $('title').text().trim(),
        metaDescription:
          $('meta[name="description"]').attr('content') ||
          $('meta[property="og:description"]').attr('content') ||
          '',
        metaSiteName: $('meta[property="og:site_name"]').attr('content') || '',
        language: $('html').attr('lang') || 'en',
        favicon:
          $('link[rel="icon"]').attr('href') ||
          $('link[rel="shortcut icon"]').attr('href') ||
          $('link[rel="apple-touch-icon"]').attr('href') ||
          '/favicon.ico',
        ogImage: $('meta[property="og:image"]').attr('content') || '',
        h1: $('h1').first().text().trim(),
        h2: $('h2').first().text().trim(),
        // Get first few paragraphs for context
        bodyText: $('p')
          .slice(0, 5)
          .map((i, el) => $(el).text().trim())
          .get()
          .join(' '),
      };

      return {
        url,
        rawData,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch page: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});

// Step 2: Extract logo as base64
const extractLogoStep = createStep({
  id: 'extract-logo',
  inputSchema: z.object({
    url: z.string(),
    rawData: z.object({
      title: z.string(),
      metaDescription: z.string(),
      metaSiteName: z.string(),
      language: z.string(),
      favicon: z.string(),
      ogImage: z.string(),
      h1: z.string(),
      h2: z.string(),
      bodyText: z.string(),
    }),
  }),
  outputSchema: z.object({
    url: z.string(),
    rawData: z.object({
      title: z.string(),
      metaDescription: z.string(),
      metaSiteName: z.string(),
      language: z.string(),
      favicon: z.string(),
      ogImage: z.string(),
      h1: z.string(),
      h2: z.string(),
      bodyText: z.string(),
    }),
    logo: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { rawData, url } = inputData;

    try {
      // Try to get the best logo/favicon URL
      let logoUrl = rawData.ogImage || rawData.favicon;

      // Make absolute URL if relative
      if (logoUrl && !logoUrl.startsWith('http')) {
        const urlObj = new URL(url);
        if (logoUrl.startsWith('//')) {
          logoUrl = `${urlObj.protocol}${logoUrl}`;
        } else if (logoUrl.startsWith('/')) {
          logoUrl = `${urlObj.protocol}//${urlObj.host}${logoUrl}`;
        } else {
          logoUrl = `${urlObj.protocol}//${urlObj.host}/${logoUrl}`;
        }
      }

      // Fetch and convert to base64
      if (logoUrl) {
        try {
          const imageResponse = await axios.get(logoUrl, {
            responseType: 'arraybuffer',
            timeout: 5000,
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          });

          const contentType =
            imageResponse.headers['content-type'] || 'image/png';
          const base64 = Buffer.from(imageResponse.data, 'binary').toString(
            'base64'
          );
          const logo = `data:${contentType};base64,${base64}`;

          return { url, rawData, logo };
        } catch (error) {
          console.warn('Failed to fetch logo, using empty string:', error);
          return { url, rawData, logo: '' };
        }
      }

      return { url, rawData, logo: '' };
    } catch (error) {
      console.warn('Error extracting logo:', error);
      return { url, rawData, logo: '' };
    }
  },
});

// Step 3: Use AI to extract structured business information
const extractBusinessInfoStep = createStep({
  id: 'extract-business-info',
  inputSchema: z.object({
    url: z.string(),
    rawData: z.object({
      title: z.string(),
      metaDescription: z.string(),
      metaSiteName: z.string(),
      language: z.string(),
      h1: z.string(),
      h2: z.string(),
      bodyText: z.string(),
      favicon: z.string(),
      ogImage: z.string(),
    }),
    logo: z.string(),
  }),
  outputSchema: outputSchema,
  execute: async ({ inputData }) => {
    const { rawData, url, logo } = inputData;

    const prompt = `Analyze the following webpage content and extract business information.

Website URL: ${url}
Page Title: ${rawData.title}
Meta Site Name: ${rawData.metaSiteName}
Meta Description: ${rawData.metaDescription}
Main Heading: ${rawData.h1}
Sub Heading: ${rawData.h2}
Body Content: ${rawData.bodyText}

Please provide:
1. The business/product name
2. The country code where the business operates (infer from domain, content, or context)
3. A detailed description of what the business does (2-3 sentences)
4. 3-5 specific target audience segments (e.g., "Small business owners", "E-commerce retailers", "Customer support teams")

Be specific and accurate based on the content provided.`;

    try {
      const result = await businessAnalyzer.generateVNext(prompt, {
        output: z.object({
          name: z.string().describe('The business or product name'),
          country: z
            .string()
            .describe(
              'The country code (e.g., US, UK, FR) where the business operates or is based'
            ),
          description: z
            .string()
            .describe(
              'A detailed description of what the business or product does'
            ),
          targetAudiences: z
            .array(z.string())
            .describe(
              'A list of 3-5 potential target audience segments for this business'
            ),
        }),
      });

      return {
        url,
        logo,
        name: result.object.name,
        country: result.object.country,
        description: result.object.description,
        targetAudiences: result.object.targetAudiences,
        language: rawData.language.split('-')[0] || 'en',
      };
    } catch (error) {
      throw new Error(
        `Failed to extract business info: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});

// Create the workflow
export const businessDataExtractorWorkflow = createWorkflow({
  id: 'business-data-extractor',
  description: 'Extracts business information from a website URL',
  inputSchema: z.object({
    url: z.string().url(),
  }),
  outputSchema: outputSchema,
})
  .then(fetchPageStep)
  .then(extractLogoStep)
  .then(extractBusinessInfoStep)
  .commit();

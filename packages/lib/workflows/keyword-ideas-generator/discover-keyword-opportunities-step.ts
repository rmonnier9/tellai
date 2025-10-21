import { z } from 'zod';

import { createStep } from '@mastra/core/workflows';
import { ProductSchema } from '../../dtos';
import { CurrentKeywordSchema } from './schemas';
import { CompetitorSchema } from './schemas';
import {
  createDataforseoLabsApiClient,
  getLanguageCode,
  getLocationCode,
} from '../../dataforseo';
import * as DataForSEO from 'dataforseo-client';

export const discoverKeywordOpportunitiesStep = createStep({
  id: 'discover-keyword-opportunities',
  inputSchema: z.object({
    product: ProductSchema,
    keywordsBlacklist: z.array(z.string()),
    websiteAnalysis: z.string(),
    seedKeywords: z.array(z.string()),
    currentKeywords: z.array(CurrentKeywordSchema),
    competitors: z.array(CompetitorSchema),
  }),
  outputSchema: z.object({
    product: ProductSchema,
    keywordsBlacklist: z.array(z.string()),
    websiteAnalysis: z.string(),
    seedKeywords: z.array(z.string()),
    currentKeywords: z.array(CurrentKeywordSchema),
    competitors: z.array(CompetitorSchema),
    rawKeywordData: z.array(z.any()),
  }),
  execute: async ({ inputData }) => {
    const {
      product,
      keywordsBlacklist,
      websiteAnalysis,
      seedKeywords,
      currentKeywords,
      competitors,
    } = inputData;

    const client = createDataforseoLabsApiClient();
    const allKeywords: any[] = [];

    console.log(
      `\n🔎 Discovering keywords from ${seedKeywords.length} seed keywords...`
    );
    console.log(`Seed keywords: ${seedKeywords.join(', ')}`);

    // Method 1: Keyword suggestions from seed keywords
    for (const seed of seedKeywords.slice(0, 5)) {
      console.log(`  → Getting suggestions for "${seed}"...`);
      try {
        const suggestions = await client.googleKeywordSuggestionsLive(
          new DataForSEO.DataforseoLabsGoogleKeywordSuggestionsLiveRequestInfo({
            keyword: seed,
            language_code: getLanguageCode(product.language!),
            location_code: getLocationCode(product.country!),
            limit: 30,
          })
        );
        console.log(
          `    ✓ Got ${suggestions?.tasks?.[0]?.result?.[0]?.items?.length} suggestions`
        );
        allKeywords.push(
          ...(suggestions?.tasks?.[0]?.result?.[0]?.items || [])
        );
      } catch (error) {
        console.error(`    ✗ Error getting suggestions for "${seed}":`, error);
      }
    }

    // Method 2: Related keywords
    for (const seed of seedKeywords.slice(0, 3)) {
      console.log(`  → Getting related keywords for "${seed}"...`);
      try {
        // /dataforseo_labs/google/related_keywords/live
        const related = await client.getRelatedKeywords(
          seed,
          product.language!,
          product.country!,
          2,
          30
        );
        console.log(`    ✓ Got ${related.length} related keywords`);
        allKeywords.push(...related);
      } catch (error) {
        console.error(
          `    ✗ Error getting related keywords for "${seed}":`,
          error
        );
      }
    }

    console.log(`\n📦 Total raw keywords collected: ${allKeywords.length}`);

    // Extract unique keywords - handle both response structures
    const uniqueKeywords = [
      ...new Set(
        allKeywords
          .map((kw: any) => kw.keyword || kw.keyword_data?.keyword)
          .filter(Boolean)
      ),
    ];

    console.log(`📋 Unique keywords: ${uniqueKeywords.length}`);

    if (allKeywords.length > 0 && uniqueKeywords.length === 0) {
      console.warn('⚠️ Keywords collected but none extracted!');
      console.warn(
        'Sample keyword structure:',
        JSON.stringify(allKeywords[0], null, 2).slice(0, 200)
      );
    }

    if (uniqueKeywords.length === 0) {
      console.warn('⚠️ No keywords discovered! Returning empty array.');
      return {
        product,
        keywordsBlacklist,
        websiteAnalysis,
        seedKeywords,
        currentKeywords,
        competitors,
        rawKeywordData: [],
      };
    }

    // Get keyword overview for all keywords
    const batchSize = 30;
    const keywordData = [];

    console.log(
      `\n🔍 Getting keyword overview data in batches of ${batchSize}...`
    );
    for (let i = 0; i < uniqueKeywords.length; i += batchSize) {
      const batch = uniqueKeywords.slice(i, i + batchSize);
      console.log(
        `  → Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} keywords`
      );
      try {
        // /dataforseo_labs/google/keyword_overview/live
        const overview = await client.getKeywordOverview(
          batch,
          product.language!,
          product.country!
        );
        console.log(`    ✓ Got ${overview.length} keyword data points`);
        keywordData.push(...overview);
      } catch (error) {
        console.error(`    ✗ Error getting overview for batch:`, error);
      }
    }

    console.log(`\n✅ Total keyword data collected: ${keywordData.length}`);

    if (keywordData.length === 0) {
      console.warn('⚠️ No keyword data collected from overview API!');
      console.warn('   This might indicate an API issue or empty responses');
    } else {
      console.log(`Sample keyword data:`, {
        keyword: keywordData[0].keyword,
        hasKeywordInfo: !!keywordData[0].keyword_info,
        searchVolume: keywordData[0].keyword_info?.search_volume,
      });
    }

    return {
      ...inputData,
      product,
      keywordsBlacklist,
      websiteAnalysis,
      seedKeywords,
      currentKeywords,
      competitors,
      rawKeywordData: keywordData,
    };
  },
});

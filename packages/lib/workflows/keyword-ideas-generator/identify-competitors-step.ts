import { z } from 'zod';
import { createStep } from '@mastra/core/workflows';
import { ProductSchema } from '../../dtos';
import { CurrentKeywordSchema, WorkflowDTO } from './schemas';
import { CompetitorSchema } from './schemas';
import { competitorAnalysisAgent } from './agents';
import {
  createDataforseoLabsApiClient,
  getLanguageCode,
  getLocationCode,
} from '../../dataforseo';
import * as DataForSEO from 'dataforseo-client';

function extractCompetitorDomains(text: string): string[] {
  const urlPattern =
    /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+)/g;
  const matches = text.match(urlPattern) || [];
  return [
    ...new Set(
      matches.map((m) => m.replace(/^(?:https?:\/\/)?(?:www\.)?/, ''))
    ),
  ];
}

export const identifyCompetitorsStep = createStep({
  id: 'identify-competitors',
  inputSchema: WorkflowDTO,
  outputSchema: WorkflowDTO,
  execute: async ({ inputData }) => {
    const {
      product,
      keywordsBlacklist,
      websiteAnalysis,
      seedKeywords,
      currentKeywords,
    } = inputData;

    // Use agent to identify competitors based on website analysis
    const competitorAnalysis = await competitorAnalysisAgent.generateVNext(
      `Based on this business analysis, identify 2-3 main competitors (just domain names):
        
  ${websiteAnalysis}
  
  URL: ${product?.url}
  
  Provide only competitor domain names (without https://, one per line).`
    );

    const competitorDomains = extractCompetitorDomains(competitorAnalysis.text);
    const client = createDataforseoLabsApiClient();

    const competitors = await Promise.all(
      competitorDomains.slice(0, 2).map(async (domain) => {
        //   const results = await client.getRankedKeywords(
        //     domain,
        //     product.language!,
        //     product.country!,
        //     50
        //   );

        //   /dataforseo_labs/google/ranked_keywords/live
        const results = await client.googleRankedKeywordsLive([
          new DataForSEO.DataforseoLabsGoogleRankedKeywordsLiveRequestInfo({
            target: domain,
            language_code: getLanguageCode(product?.language!),
            location_code: getLocationCode(product?.country!),
            limit: 100,
          }),
        ]);

        return {
          domain,
          keywords: results?.tasks?.[0]?.result?.[0]?.items
            ?.map((item) => ({
              keyword: item?.keyword_data?.keyword || '',
              searchVolume:
                item?.keyword_data?.keyword_info?.search_volume || 0,
              position:
                item?.ranked_serp_element?.serp_item?.rank_absolute || 0,
              difficulty: item?.keyword_properties?.keyword_difficulty || null,
            }))
            .filter((kw) => kw.position <= 10), // Top 10 only
        };
      })
    );

    return {
      ...inputData,
      product,
      keywordsBlacklist,
      websiteAnalysis,
      seedKeywords,
      currentKeywords,
      competitors,
    };
  },
});

export default identifyCompetitorsStep;

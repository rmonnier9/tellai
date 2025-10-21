import { createStep } from '@mastra/core/workflows';
import z from 'zod';
import * as DataForSEO from 'dataforseo-client';
import { DataForSEOLabsKeywordSchema, WorkflowDTO } from './schemas';
import {
  createDataforseoLabsApiClient,
  getLanguageCode,
  getLocationCode,
} from '../../dataforseo';

export const findCustomerWebsiteKeywordsStep = createStep({
  id: 'fetch-current-keywords',
  inputSchema: WorkflowDTO,
  outputSchema: WorkflowDTO,
  execute: async ({ inputData }) => {
    const { product } = inputData;

    const client = createDataforseoLabsApiClient();
    const domain = new URL(product?.url!).hostname;

    //   /dataforseo_labs/google/ranked_keywords/live
    const results = await client.googleRankedKeywordsLive([
      new DataForSEO.DataforseoLabsGoogleRankedKeywordsLiveRequestInfo({
        target: domain,
        language_code: getLanguageCode(product?.language!),
        location_code: getLocationCode(product?.country!),
        limit: 100,
        include_serp_info: true,
        load_rank_absolute: true,
        filters: [
          ['keyword_data.search_intent_info.main_intent', '=', 'informational'],
          'and',
          ['keyword_data.keyword_info.search_volume', '>', 10],
          'and',
          [
            'keyword_data.keyword_info.competition_level',
            'in',
            ['LOW', 'MEDIUM', 'HIGH'],
          ],
          ...(inputData.keywordsBlacklist?.length
            ? [
                'and',
                ['keyword_data.keyword', 'not_in', inputData.keywordsBlacklist],
              ]
            : []),
        ],
      }),
    ]);

    const keywords: z.infer<typeof DataForSEOLabsKeywordSchema>[] =
      results?.tasks?.[0]?.result?.[0]?.items?.map((item) => ({
        keyword: item?.keyword_data?.keyword || '',
        searchVolume: item?.keyword_data?.keyword_info?.search_volume,
        position: item?.ranked_serp_element?.serp_item?.rank_absolute,
        intent: item?.keyword_data?.search_intent_info?.main_intent,
        competitionLevel: item?.keyword_data?.keyword_info?.competition_level,
        keywordDifficulty: item?.keyword_properties?.keyword_difficulty,
      })) || [];

    return {
      ...inputData,
      customerRankedKeywords: keywords,
    };
  },
});

export default findCustomerWebsiteKeywordsStep;

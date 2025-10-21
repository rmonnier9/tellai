import { createStep } from '@mastra/core/workflows';
import pMap from 'p-map';
import { z } from 'zod';
import * as DataForSEO from 'dataforseo-client';
import { DataForSEOLabsKeywordSchema, WorkflowDTO } from './schemas';
import {
  createDataforseoLabsApiClient,
  getLanguageCode,
  getLocationCode,
} from '../../dataforseo';

export const findCompetitorsKeywordsStep = createStep({
  id: 'find-competitors-keywords',
  inputSchema: WorkflowDTO,
  outputSchema: WorkflowDTO,
  execute: async ({ inputData }) => {
    const { product } = inputData;

    const client = createDataforseoLabsApiClient();
    const competitorsWebsites =
      product?.competitors.map((competitor) => new URL(competitor).hostname) ||
      [];

    if (competitorsWebsites.length === 0) {
      return {
        ...inputData,
        competitorsKeywords: [],
      };
    }

    const results = await pMap(
      competitorsWebsites,
      async (website) => {
        //   /dataforseo_labs/google/ranked_keywords/live

        const results = await client.googleRankedKeywordsLive([
          new DataForSEO.DataforseoLabsGoogleRankedKeywordsLiveRequestInfo({
            target: website,
            language_code: getLanguageCode(product?.language!),
            location_code: getLocationCode(product?.country!),
            limit: 100,
            include_serp_info: true,
            load_rank_absolute: true,
            filters: [
              [
                'keyword_data.search_intent_info.main_intent',
                '=',
                'informational',
              ],
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
                    [
                      'keyword_data.keyword',
                      'not_in',
                      inputData.keywordsBlacklist,
                    ],
                  ]
                : []),
            ],
          }),
        ]);

        const keywords: z.infer<typeof DataForSEOLabsKeywordSchema>[] = (
          results?.tasks?.[0]?.result?.[0]?.items?.map((item) => ({
            keyword: item?.keyword_data?.keyword || '',
            searchVolume: item?.keyword_data?.keyword_info?.search_volume,
            position: item?.ranked_serp_element?.serp_item?.rank_absolute,
            intent: item?.keyword_data?.search_intent_info?.main_intent,
            competitionLevel:
              item?.keyword_data?.keyword_info?.competition_level,
            keywordDifficulty: item?.keyword_properties?.keyword_difficulty,
          })) || []
        )?.filter(
          (keyword) =>
            keyword.searchVolume !== null &&
            keyword.searchVolume !== undefined &&
            keyword.searchVolume > 0
        );

        return keywords;
      },
      {
        concurrency: 3,
      }
    );

    return {
      ...inputData,
      competitorsKeywords: results?.flat() || [],
    };
  },
});

export default findCompetitorsKeywordsStep;

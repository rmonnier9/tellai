import { createStep } from '@mastra/core/workflows';
import {
  createDataforseoLabsApiClient,
  createKeywordsDataApiClient,
} from '../../dataforseo';
import * as DataForSEO from 'dataforseo-client';
import { getLanguageCode, getLocationCode } from '../../dataforseo';
import { z } from 'zod';
import { keywordsFilteringAgent } from './agents';
import { DataForSEOLabsKeywordSchema, WorkflowDTO } from './schemas';

export const growSeedKeywordsStep = createStep({
  id: 'grow-seed-keywords',
  inputSchema: WorkflowDTO,
  outputSchema: WorkflowDTO,
  execute: async ({ inputData }) => {
    const { product, seedKeywords } = inputData;

    const client = createKeywordsDataApiClient();
    const clientLabs = createDataforseoLabsApiClient();

    const task = await client.googleAdsKeywordsForKeywordsLive([
      new DataForSEO.KeywordsDataGoogleAdsKeywordsForKeywordsLiveRequestInfo({
        keywords: seedKeywords || [],
        language_code: getLanguageCode(product?.language!),
        location_code: getLocationCode(product?.country!),
        sort_by: 'relevance',
      }),
    ]);

    console.log('dataforseo api call cost: ', task?.cost);

    const googleAdsKeywords = [
      ...new Set(task?.tasks?.[0]?.result?.map((each) => each?.keyword) || []),
    ].slice(0, 500);

    console.log(`Found ${googleAdsKeywords.length} unique Google Ads keywords`);

    const filteredKeywordsResponse = await keywordsFilteringAgent.generateVNext(
      `Filter the following keywords to keep only the ones that are relevant to the business and target audience: 
  Business: ${product?.name}
  Description: ${product?.description}
  Target Audiences: ${product?.targetAudiences.join(', ')}
  Filtered keywords must be approriate for informational blog content.
  ${googleAdsKeywords.join('\n')}
  
  Output in json format
  `,
      {
        structuredOutput: {
          schema: z.object({
            keywords: z.array(z.string()),
          }),
        },
      }
    );

    const filteredKeywords = filteredKeywordsResponse?.object?.keywords
      ?.filter((keyword) => {
        // DataForSEO keyword overview limitations:
        // - Max 80 characters per keyword
        // - Max 10 words per keyword phrase
        const wordCount = keyword.trim().split(/\s+/).length;
        return keyword.length <= 80 && wordCount <= 10;
      })
      .slice(0, 700); // Max 700 keywords

    console.log('filteredKeywords.length', filteredKeywords.length);
    console.log('filteredKeywords', filteredKeywords);

    const enrichKeywords = await clientLabs.googleKeywordOverviewLive([
      new DataForSEO.DataforseoLabsGoogleKeywordOverviewLiveRequestInfo({
        keywords: filteredKeywords || [],
        language_code: getLanguageCode(product?.language!),
        location_code: getLocationCode(product?.country!),
      }),
    ]);

    const enrichedKeywords = enrichKeywords?.tasks?.[0]?.result?.[0]?.items
      ?.map(
        (item) =>
          ({
            keyword: item?.keyword!,
            keywordDifficulty: item?.keyword_properties?.keyword_difficulty!,
            searchVolume: item?.keyword_info?.search_volume!,
            intent: item?.search_intent_info?.main_intent!,
            competitionLevel: item?.keyword_info?.competition_level!,
          }) satisfies z.infer<typeof DataForSEOLabsKeywordSchema>
      )
      .filter(
        (keyword) =>
          keyword.searchVolume !== null &&
          keyword.searchVolume !== undefined &&
          keyword.searchVolume > 0
      );

    console.log('enrichedKeywords.length', enrichedKeywords?.length);

    return {
      ...inputData,
      growedSeedKeywords: enrichedKeywords,
    };
  },
});

export default growSeedKeywordsStep;

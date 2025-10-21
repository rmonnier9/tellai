import { createStep } from '@mastra/core/workflows';
import { createKeywordsDataApiClient } from '../../dataforseo';
import * as DataForSEO from 'dataforseo-client';
import { getLanguageCode, getLocationCode } from '../../dataforseo';
import { z } from 'zod';
import { keywordsFilteringAgent } from './agents';
import { WorkflowDTO } from './schemas';

export const generateSeedKeywordsWithGoogleAdsStep = createStep({
  id: 'generate-seed-keywords-with-google-ads',
  inputSchema: WorkflowDTO,
  outputSchema: WorkflowDTO,
  execute: async ({ inputData }) => {
    const { product, totalCostDataForSEO } = inputData;

    const client = createKeywordsDataApiClient();

    const task = await client.googleAdsKeywordsForSiteLive([
      new DataForSEO.KeywordsDataGoogleAdsKeywordsForSiteLiveRequestInfo({
        language_code: getLanguageCode(product?.language!),
        location_code: getLocationCode(product?.country!),
        target: product?.url,
      }),
    ]);

    console.log('dataforseo api call cost: ', task?.cost);

    const googleAdsKeywords =
      task?.tasks?.[0]?.result
        ?.filter((each) => ['LOW'].includes(each?.competition || ''))
        ?.map((each) => each?.keyword)
        ?.filter((keyword): keyword is string => keyword !== undefined) || [];

    const uniqueGoogleAdsKeywords = [...new Set(googleAdsKeywords)];
    console.log(
      `Found ${uniqueGoogleAdsKeywords.length} unique Google Ads keywords`
    );

    const filteredKeywordsResponse = await keywordsFilteringAgent.generateVNext(
      `Filter the following keywords to keep only the ones that are relevant to the business and target audience: 
  Business: ${product?.name}
  Description: ${product?.description}
  Target Audiences: ${product?.targetAudiences.join(', ')}
  Filtered keywords must be approriate for informational blog content.
  ${uniqueGoogleAdsKeywords.join('\n')}
  
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

    const filteredKeywords = filteredKeywordsResponse?.object?.keywords;

    console.log('filteredKeywords.length', filteredKeywords.length);
    console.log('filteredKeywords', filteredKeywords);

    throw new Error('test');

    return {
      ...inputData,
      totalCostDataForSEO: (totalCostDataForSEO || 0) + (task?.cost || 0),
      googleAdsKeywords: uniqueGoogleAdsKeywords,
    };
  },
});

export default generateSeedKeywordsWithGoogleAdsStep;

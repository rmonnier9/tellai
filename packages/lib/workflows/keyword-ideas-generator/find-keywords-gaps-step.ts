import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { findKeywordsGapsAgent } from './agents';
import { WorkflowDTO } from './schemas';

export const findKeywordsGapsStep = createStep({
  id: 'find-keywords-gaps',
  inputSchema: WorkflowDTO,
  outputSchema: WorkflowDTO,
  execute: async ({ inputData }) => {
    const { product, customerRankedKeywords, competitorsKeywords } = inputData;

    const customerKeywordsStrings =
      customerRankedKeywords?.map((keyword) => keyword.keyword) || [];
    const competitorsKeywordsStrings =
      competitorsKeywords?.map((keyword) => keyword.keyword) || [];

    if (competitorsKeywordsStrings.length === 0) {
      return {
        ...inputData,
        competitorsKeywordsGaps: [],
      };
    }

    const response = await findKeywordsGapsAgent.generateVNext(
      `Find keywords that are not ranked by the customer but are ranked by the competitors and relevant to our customer business:
  URL: ${product?.url}
  Business: ${product?.name}
  Description: ${product?.description}
  Target Audiences: ${product?.targetAudiences.join(', ')}
  Customer keywords: ${customerKeywordsStrings?.join(', ')}
  Competitors keywords: ${competitorsKeywordsStrings?.join(', ')}
  
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

    const gaps = response?.object?.keywords;

    console.log(`✅ Found ${gaps.length} seed keywords:`);
    console.log(JSON.stringify(gaps, null, 2));

    // Now find all occurrence in competitorsKeywords
    const competitorsKeywordsGaps = competitorsKeywords?.filter((keyword) =>
      gaps.includes(keyword.keyword)
    );

    return {
      ...inputData,
      competitorsKeywordsGaps,
    };
  },
});

export default findKeywordsGapsStep;

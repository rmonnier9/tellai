import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { keywordsPickerAgent } from './agents';
import { WorkflowDTO } from './schemas';

export const pickBestKeywordsStep = createStep({
  id: 'pick-best-keywords',
  inputSchema: WorkflowDTO,
  outputSchema: WorkflowDTO,
  execute: async ({ inputData }) => {
    const { product, competitorsKeywordsGaps, growedSeedKeywords } = inputData;

    const seedKeywordsResponse = await keywordsPickerAgent.generateVNext(
      `Customer URL: ${product?.url}
  Customer Business Name: ${product?.name}
  Customer Business Description: ${product?.description}
  Customer Target Audiences: ${product?.targetAudiences.join(', ')}

  ${
    competitorsKeywordsGaps?.length
      ? `Competitors Keywords Gaps: ${competitorsKeywordsGaps
          ?.slice(0, 250)
          ?.map((keyword) => keyword.keyword)
          .join(', ')}`
      : ``
  }
  ${
    growedSeedKeywords?.length
      ? `Google Ads Keywords: ${growedSeedKeywords
          ?.slice(0, 250)
          ?.map((keyword) => keyword.keyword)
          .join(', ')}`
      : ``
  }

  Pick exactly 30 unique keywords.

  Output in json format
  `,
      {
        structuredOutput: {
          schema: z.object({
            keywords: z.array(z.string()).min(30).max(30),
          }),
        },
      }
    );

    const pickedKeywordsStrings = seedKeywordsResponse?.object?.keywords;

    const growedSeedKeywordsPicked =
      growedSeedKeywords?.filter((keyword) =>
        pickedKeywordsStrings.includes(keyword.keyword)
      ) || [];
    const competitorsKeywordsGapsKeywordsPicked =
      competitorsKeywordsGaps?.filter((keyword) =>
        pickedKeywordsStrings.includes(keyword.keyword)
      ) || [];

    const finalKeywords = [
      ...growedSeedKeywordsPicked,
      ...competitorsKeywordsGapsKeywordsPicked,
    ];

    console.log(`✅ Picked ${finalKeywords.length} keywords:`);

    return {
      ...inputData,
      keywords: finalKeywords,
    };
  },
});

export default pickBestKeywordsStep;

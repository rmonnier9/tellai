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

    const uniqueKeywords = [
      ...(competitorsKeywordsGaps || []),
      ...(growedSeedKeywords || []),
    ].filter(
      (keyword, index, self) =>
        index ===
        self.findIndex(
          (t) => t.keyword.toLowerCase() === keyword.keyword.toLowerCase()
        )
    );

    const seedKeywordsResponse = await keywordsPickerAgent.generateVNext(
      `Customer URL: ${product?.url}
  Customer Business Name: ${product?.name}
  Customer Business Description: ${product?.description}
  Customer Target Audiences: ${product?.targetAudiences.join(', ')}

  ${
    uniqueKeywords?.length
      ? `Keywords: ${uniqueKeywords
          ?.slice(0, 500)
          ?.map((keyword) => keyword.keyword)
          .join(', ')}`
      : ``
  }


  Pick exactly 30 unique keywords, no more, no less.

  Output in json format
  `,
      {
        structuredOutput: {
          schema: z.object({
            keywords: z.array(z.string()).min(30),
          }),
        },
      }
    );

    const pickedKeywordsStrings = seedKeywordsResponse?.object?.keywords;

    const finalKeywords = uniqueKeywords.filter((keyword) =>
      pickedKeywordsStrings.includes(keyword.keyword)
    );

    console.log(`✅ Picked ${finalKeywords.length} keywords:`);

    return {
      ...inputData,
      keywords: finalKeywords,
    };
  },
});

export default pickBestKeywordsStep;

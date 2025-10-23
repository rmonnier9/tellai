import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { seedKeywordsAgent } from './agents';
import { WorkflowDTO } from './schemas';

export const generateSeedKeywordsWithAIStep = createStep({
  id: 'generate-seed-keywords-with-google-ads',
  inputSchema: WorkflowDTO,
  outputSchema: WorkflowDTO,
  execute: async ({ inputData }) => {
    const { product, keywordsBlacklist } = inputData;

    const seedKeywordsResponse = await seedKeywordsAgent.generateVNext(
      `Generate seed keywords for relevant to the business (30 keywords).
      
Goal is to generate 30 main keywords (not long tail keywords) in order to build topical authority in their niche: 
  URL: ${product?.url}
  Business: ${product?.name}
  Description: ${product?.description}
  Target Audiences: ${product?.targetAudiences.join(', ')}

  Exclude the following keywords:
  ${(keywordsBlacklist || []).join('\n')}
  
  Output in json format
  `,
      {
        structuredOutput: {
          schema: z.object({
            keywords: z.array(z.string()).length(30),
          }),
        },
      }
    );

    const seedKeywords = seedKeywordsResponse?.object?.keywords?.map((each) =>
      each.toLowerCase().trim()
    );

    console.log(`✅ Generated ${seedKeywords.length} seed keywords:`);
    console.log(JSON.stringify(seedKeywords, null, 2));

    return {
      ...inputData,
      seedKeywords,
    };
  },
});

export default generateSeedKeywordsWithAIStep;

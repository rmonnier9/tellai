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
      `Generate seed keywords for relevant to the business (max 20 keywords, 80 characters max per keyword): 
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
            keywords: z.array(z.string().max(80)).max(20),
          }),
        },
      }
    );

    const seedKeywords = seedKeywordsResponse?.object?.keywords?.slice(0, 20);

    console.log(`✅ Generated ${seedKeywords.length} seed keywords:`);
    console.log(JSON.stringify(seedKeywords, null, 2));

    return {
      ...inputData,
      seedKeywords,
    };
  },
});

export default generateSeedKeywordsWithAIStep;

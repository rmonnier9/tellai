import { WorkflowDTO } from './schemas';
import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { websiteAnalysisAgent } from './agents';

export const analyzeWebsiteStep = createStep({
  id: 'analyze-website',
  inputSchema: WorkflowDTO,
  outputSchema: WorkflowDTO,
  execute: async ({ inputData }) => {
    const { product, keywordsBlacklist } = inputData;

    // // Fetch website content
    // const websiteContent = await fetch(product.url)
    //   .then((res) => res.text())
    //   .catch(() => '');

    // Analyze with agent to get seed keywords
    const analysis = await websiteAnalysisAgent.generateVNext(
      `Analyze this website and provide seed keywords for SEO keyword research:
        
  URL: ${product?.url}
  Name: ${product?.name}
  Description: ${product?.description}
  Target Audiences: ${product?.targetAudiences.join(', ')}
  
  Based on this information, provide:
  1. A brief business analysis (1-2 paragraphs)
  2. EXACTLY 10 seed keywords for keyword research
  
  The seed keywords should be:
  - Short phrases (2-4 words max)
  - Related to the business and target audience
  - In ${product?.language} language
  - Suitable for DataForSEO API queries
  
  Outpur in json format
  `,
      {
        structuredOutput: {
          schema: z.object({
            businessAnalysis: z.string(),
            seedKeywords: z.array(z.string()),
          }),
        },
      }
    );

    const { businessAnalysis, seedKeywords } = analysis.object;

    console.log('\n📝 Website analysis complete');
    console.log('Extracting seed keywords from analysis...');
    // const seedKeywords = extractSeedKeywords(analysis.text);
    console.log(
      `✅ Extracted ${seedKeywords.length} seed keywords:`,
      seedKeywords
    );
    console.log('businessAnalysis', businessAnalysis);

    return {
      ...inputData,
      product,
      keywordsBlacklist,
      websiteAnalysis: businessAnalysis,
      seedKeywords,
    };
  },
});

export default analyzeWebsiteStep;

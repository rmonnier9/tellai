'use server';

import { mastra } from '@workspace/lib/mastra';

export async function analyzeBusinessUrl(url: string) {
  try {
    const workflow = mastra.getWorkflow('businessDataExtractorWorkflow');

    const run = await workflow.createRunAsync();

    const result = await run.start({
      inputData: {
        url,
      },
    });

    console.log('Business analysis result:', JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error('Error analyzing business URL:', error);
    throw error;
  }
}

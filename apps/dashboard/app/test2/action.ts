'use server';

import { mastra } from '@workspace/lib/mastra';

export async function getBusinessData(formData: FormData) {
  const url = formData.get('url')?.toString() as string;
  const workflow = mastra.getWorkflow('businessDataExtractorWorkflow');

  const run = await workflow.createRunAsync();

  const result = await run.start({
    inputData: {
      url,
    },
  });

  // const result = await agent.generate(`What's the weather like in ${city}?`);

  console.log(JSON.stringify(result, null, 2));

  return JSON.stringify(result, null, 2);
}

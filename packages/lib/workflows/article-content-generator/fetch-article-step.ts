import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { WorkflowInputSchema, WorkflowDTO } from './schemas';
import { prisma } from '@workspace/db';

// Step 1: Fetch SERP Results from DataForSEO
const fetchArticleStep = createStep({
  id: 'fetch-article',
  inputSchema: WorkflowInputSchema,
  outputSchema: WorkflowDTO,
  execute: async ({ inputData }) => {
    const { articleId } = inputData;

    const article = await prisma.article.findUnique({
      where: {
        id: articleId,
      },
      include: {
        product: true,
      },
    });

    return {
      ...inputData,
      article: article as z.infer<typeof WorkflowDTO>['article'],
      product: article?.product,
    };
  },
});

export default fetchArticleStep;

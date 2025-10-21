import { normalizeKeyword } from './utils';
import { createStep } from '@mastra/core/workflows';
import { WorkflowDTO, WorkflowInputSchema } from './schemas';
import prisma from '@workspace/db/prisma/client';

export const fetchProductDataStep = createStep({
  id: 'fetch-product-data',
  inputSchema: WorkflowInputSchema,
  outputSchema: WorkflowDTO,
  execute: async ({ inputData }) => {
    const product = await prisma.product.findUnique({
      where: { id: inputData.id },
    });

    if (!product) {
      throw new Error(`Product not found: ${inputData.id}`);
    }

    console.log(`\n🔍 Fetching existing articles for product: ${product.name}`);

    try {
      const existingArticles = await prisma.article.findMany({
        where: { productId: inputData.id },
        select: { keyword: true },
      });

      const keywordsBlacklist = existingArticles.map((article) =>
        normalizeKeyword(article.keyword)
      );

      console.log(
        `✅ Found ${keywordsBlacklist.length} existing keywords to exclude`
      );

      return {
        product,
        keywordsBlacklist,
      };
    } catch (error) {
      console.warn(
        'Failed to fetch existing articles, continuing without deduplication:',
        error
      );
      return {
        ...inputData,
        product,
        keywordsBlacklist: [],
      };
    }
  },
});

export default fetchProductDataStep;

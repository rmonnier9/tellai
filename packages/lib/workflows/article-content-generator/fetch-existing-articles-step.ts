import { createStep } from '@mastra/core/workflows';
import prisma from '@workspace/db/prisma/client';
import { WorkflowDTO } from './schemas';

// Step 2: Fetch existing articles from the same product for internal linking
const fetchExistingArticlesStep = createStep({
  id: 'fetch-existing-articles',
  inputSchema: WorkflowDTO,
  outputSchema: WorkflowDTO,
  execute: async ({ inputData }) => {
    const { article, product } = inputData;

    try {
      // Fetch existing published articles from the same product
      // Exclude the current article being generated
      const articles = await prisma.article.findMany({
        where: {
          product: {
            url: product?.url,
          },
          status: {
            in: ['published', 'generated'],
          },
          id: {
            not: article?.id,
          },
          content: {
            not: null,
          },
        },
        select: {
          id: true,
          title: true,
          keyword: true,
          publications: {
            select: {
              url: true,
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20, // Limit to 20 most recent articles
      });

      // Transform articles into a format suitable for internal linking
      // Only include articles that have been published with a URL
      const existingArticles = articles
        .map((article) => {
          const publishedUrl = article.publications[0]?.url;
          if (!publishedUrl) return null;

          return {
            id: article.id,
            title: article.title || '',
            keyword: article.keyword,
            url: publishedUrl,
          };
        })
        .filter(
          (article): article is NonNullable<typeof article> => article !== null
        );

      console.log(
        `Found ${existingArticles.length} existing articles for internal linking`
      );

      return {
        ...inputData,
        existingArticles,
      };
    } catch (error) {
      console.error('Error fetching existing articles:', error);
      // Continue workflow without existing articles rather than failing
      return {
        ...inputData,
        existingArticles: [],
      };
    }
  },
});

export default fetchExistingArticlesStep;

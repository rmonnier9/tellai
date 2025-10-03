import { mastra } from '../mastra';
import prisma from '@workspace/db/prisma/client';

/**
 * Example usage of the keyword ideas generator workflow
 *
 * This function:
 * 1. Fetches a product from the database
 * 2. Runs the keyword ideas generator workflow
 * 3. Creates Article records in the database with the results
 */
export async function generateArticleIdeasForProduct(productId: string) {
  try {
    // Fetch product from database
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        organization: true,
      },
    });

    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    if (!product.name || !product.description) {
      throw new Error(
        'Product must have name and description to generate article ideas'
      );
    }

    console.log(`Generating article ideas for product: ${product.name}`);

    // Run the workflow
    const workflow = mastra.getWorkflow('keywordIdeasGeneratorWorkflow');
    const run = await workflow.createRunAsync();

    const workflowResult = await run.start({
      inputData: {
        id: product.id,
        name: product.name,
        description: product.description,
        country: product.country || 'US',
        language: product.language || 'en',
        targetAudiences: product.targetAudiences || [],
        url: product.url,
      },
    });

    // Check if workflow succeeded
    if (workflowResult.status !== 'success') {
      const errorMsg =
        workflowResult.status === 'failed'
          ? workflowResult.error?.message || 'Unknown error'
          : `Workflow status: ${workflowResult.status}`;
      throw new Error(`Workflow failed: ${errorMsg}`);
    }

    // Extract the actual result from the workflow response
    const result = workflowResult.result;

    console.log(`Generated ${result.totalIdeas} article ideas`);

    // Create Article records in the database
    const articles = await Promise.all(
      result.articleIdeas.map(async (idea: any) => {
        return prisma.article.create({
          data: {
            productId: product.id,
            keyword: idea.keyword,
            title: idea.title,
            type: idea.type,
            guideSubtype: idea.guideSubtype || null,
            listicleSubtype: idea.listicleSubtype || null,
            searchVolume: idea.searchVolume,
            keywordDifficulty: idea.keywordDifficulty,
            cpc: idea.cpc,
            competition: idea.competition,
            scheduledDate: new Date(idea.scheduledDate),
            status: 'pending',
          },
        });
      })
    );

    console.log(`Created ${articles.length} article records in database`);

    return {
      product,
      articles,
      summary: {
        totalIdeas: result.totalIdeas,
        guides: articles.filter((a: any) => a.type === 'guide').length,
        listicles: articles.filter((a: any) => a.type === 'listicle').length,
      },
    };
  } catch (error) {
    console.error('Error generating article ideas:', error);
    throw error;
  }
}

/**
 * Example: Generate article ideas for all products in an organization
 */
export async function generateArticleIdeasForOrganization(
  organizationId: string
) {
  try {
    const products = await prisma.product.findMany({
      where: { organizationId },
    });

    console.log(`Found ${products.length} products for organization`);

    const results = [];

    for (const product of products) {
      if (product.name && product.description) {
        try {
          const result = await generateArticleIdeasForProduct(product.id);
          results.push(result);
        } catch (error) {
          console.error(
            `Failed to generate ideas for product ${product.id}:`,
            error
          );
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Error generating article ideas for organization:', error);
    throw error;
  }
}

/**
 * Example: Get upcoming scheduled articles
 */
export async function getUpcomingArticles(productId: string, days: number = 7) {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return prisma.article.findMany({
    where: {
      productId,
      scheduledDate: {
        gte: now,
        lte: futureDate,
      },
      status: 'pending',
    },
    orderBy: {
      scheduledDate: 'asc',
    },
  });
}

/**
 * Example: Update article status
 */
export async function updateArticleStatus(
  articleId: string,
  status: 'pending' | 'generated' | 'published',
  content?: string,
  publishedUrl?: string
) {
  return prisma.article.update({
    where: { id: articleId },
    data: {
      status,
      content,
      publishedUrl,
    },
  });
}

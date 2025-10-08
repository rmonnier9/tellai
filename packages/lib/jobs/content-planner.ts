import { Job } from '@workspace/db/prisma/generated/client';
import { mastra } from '../mastra';
import prisma from '@workspace/db/prisma/client';

export const contentPlanner = async (job: Job) => {
  const productId = job.productId;

  if (!productId) {
    throw new Error('No product ID provided');
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }

  const workflow = mastra.getWorkflow('keywordIdeasGeneratorWorkflow');
  const run = await workflow.createRunAsync();

  const workflowResult = await run.start({
    inputData: {
      id: product.id,
      name: product.name!,
      description: product.description!,
      country: product.country!,
      language: product.language!,
      targetAudiences: product.targetAudiences,
      url: product.url,
    },
  });

  console.log('Workflow completed');
  console.log(JSON.stringify(workflowResult, null, 2));

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

  // If using a real product ID, save the results to the database
  if (productId && result?.articleIdeas?.length > 0) {
    const articles = await prisma.article.createMany({
      data: result.articleIdeas.map((idea: any) => ({
        productId: productId,
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
      })),
    });

    console.log(`✅ Saved ${articles.count} articles to database`);
  }
};

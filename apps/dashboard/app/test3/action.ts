'use server';

import { mastra } from '@workspace/lib/mastra';
import prisma from '@workspace/db/prisma/client';

export async function generateKeywordIdeas(formData: FormData) {
  try {
    const productId = formData.get('productId')?.toString();

    let productData;

    // Option 1: Fetch existing product from database
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      if (!product.name || !product.description) {
        throw new Error('Product must have name and description');
      }

      productData = {
        id: product.id,
        name: product.name,
        description: product.description,
        country: product.country || 'US',
        language: product.language || 'en',
        targetAudiences: product.targetAudiences || [],
        url: product.url,
      };

      console.log('Using existing product:', productData.name);
    }
    // Option 2: Use manual input data
    else {
      const name = formData.get('name')?.toString();
      const description = formData.get('description')?.toString();
      const url = formData.get('url')?.toString();
      const country = formData.get('country')?.toString() || 'US';
      const language = formData.get('language')?.toString() || 'en';
      const targetAudiencesStr = formData.get('targetAudiences')?.toString();

      if (!name || !description || !url) {
        throw new Error(
          'Please provide either a Product ID or fill in Name, Description, and URL'
        );
      }

      const targetAudiences = targetAudiencesStr
        ? targetAudiencesStr.split(',').map((a) => a.trim())
        : [];

      productData = {
        id: 'test-product',
        name,
        description,
        country,
        language,
        targetAudiences,
        url,
      };

      console.log('Using manual product data:', productData.name);
    }

    // Execute the workflow
    console.log('Starting keyword ideas workflow...');
    const workflow = mastra.getWorkflow('keywordIdeasGeneratorWorkflow');
    const run = await workflow.createRunAsync();

    const workflowResult = await run.start({
      inputData: productData,
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
    if (productId && result) {
      console.log(
        `Saving ${result.articleIdeas.length} article ideas to database...`
      );

      const articles = await Promise.all(
        result.articleIdeas.map(async (idea: any) => {
          return prisma.article.create({
            data: {
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
            },
          });
        })
      );

      console.log(`✅ Saved ${articles.length} articles to database`);

      return JSON.stringify(
        {
          success: true,
          message: `Generated and saved ${articles.length} article ideas`,
          ...result,
          savedArticles: articles.map((a: any) => ({
            id: a.id,
            keyword: a.keyword,
            title: a.title,
            type: a.type,
            scheduledDate: a.scheduledDate,
          })),
        },
        null,
        2
      );
    }

    // For test data, just return the results
    return JSON.stringify(
      {
        success: true,
        message: 'Keyword ideas generated (test mode - not saved to database)',
        ...result,
      },
      null,
      2
    );
  } catch (error) {
    console.error('Error generating keyword ideas:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return JSON.stringify(
      {
        success: false,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      },
      null,
      2
    );
  }
}

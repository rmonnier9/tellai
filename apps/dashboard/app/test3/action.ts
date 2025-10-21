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
        // name: product.name,
        // description: product.description,
        // country: product.country || 'US',
        // language: product.language || 'en',
        // targetAudiences: product.targetAudiences || [],
        // url: product.url,
      };

      console.log('Using existing product:', productData.id);
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
      };
    }

    // Execute the workflow
    console.log('Starting keyword discovery workflow...');
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

    // If using a real product ID, save the keywords to the database
    if (productId && result) {
      console.log(
        `Saving ${result.keywords?.length} discovered keywords to database...`
      );

      const articles = await Promise.all(
        (result.keywords || []).map(async (keyword) => {
          return prisma.article.create({
            data: {
              product: {
                connect: { id: productId },
              },
              keyword: keyword.keyword,
              searchVolume: keyword.searchVolume,
              keywordDifficulty: keyword.keywordDifficulty,
              scheduledDate: keyword.scheduledDate!, // 1 per day for 30 days
              status: 'pending',
            },
          });
        })
      );

      console.log(`✅ Saved ${articles.length} keywords to database`);

      return JSON.stringify(
        {
          success: true,
          message: `Discovered and saved ${articles.length} keywords with content recommendations`,
          ...result,
          savedKeywords: articles.map((a: any) => ({
            id: a.id,
            keyword: a.keyword,
            searchVolume: a.searchVolume,
            keywordDifficulty: a.keywordDifficulty,
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

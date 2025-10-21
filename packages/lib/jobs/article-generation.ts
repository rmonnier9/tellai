import prisma from '@workspace/db/prisma/client';
import { Job } from '@workspace/db/prisma/generated/client';
import { mastra } from '../mastra';
import { getPublisher } from '../publishers';

export const articleGeneration = async (job: Job) => {
  const articleId = job.articleId;

  if (!articleId) {
    throw new Error('No article ID provided');
  }

  // Fetch the article with its related product data
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      product: true,
    },
  });

  if (!article) {
    throw new Error(`Article with ID ${articleId} not found`);
  }

  // Prepare workflow input
  const workflowInput = {
    articleId,
    articleData: {
      keyword: article.keyword,
      title: article.title,
      type: article.type as 'guide' | 'listicle',
      guideSubtype: article.guideSubtype as
        | 'how_to'
        | 'explainer'
        | 'comparison'
        | 'reference'
        | null,
      listicleSubtype: article.listicleSubtype as
        | 'round_up'
        | 'resources'
        | 'examples'
        | null,
      searchVolume: article.searchVolume,
      keywordDifficulty: article.keywordDifficulty,
      cpc: article.cpc,
      competition: article.competition,
    },
    productData: {
      name: article.product.name,
      description: article.product.description,
      url: article.product.url,
      language: article.product.language,
      country: article.product.country,
      targetAudiences: article.product.targetAudiences,
      bestArticles: article.product.bestArticles,
      articleStyle: article.product.articleStyle,
      internalLinks: article.product.internalLinks,
      globalInstructions: article.product.globalInstructions,
      includeYoutubeVideo: article.product.includeYoutubeVideo,
      includeCallToAction: article.product.includeCallToAction,
      includeInfographics: article.product.includeInfographics,
      includeEmojis: article.product.includeEmojis,
    },
  };

  // Get the article content generator workflow
  const workflow = mastra.getWorkflow('articleContentGeneratorWorkflow');
  const run = await workflow.createRunAsync();

  // Execute the workflow
  const workflowResult = await run.start({
    inputData: workflowInput,
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

  // Extract the result from the workflow response
  const result = workflowResult.result;

  if (!result) {
    throw new Error('Workflow returned no result');
  }

  // Extract hero image URL from generated images
  const heroImage = result.images?.find((img: any) => img.type === 'hero');
  const featuredImageUrl = heroImage?.url || null;

  // Update the article with the generated content
  const updatedArticle = await prisma.article.update({
    where: { id: articleId },
    data: {
      title: result.title,
      metaDescription: result.metaDescription,
      content: result.content,
      featuredImageUrl: featuredImageUrl,
      status: 'generated',
    },
  });

  console.log(
    `✅ Article content generated and saved for article ${articleId}`
  );

  // Auto-publish if enabled
  const publications: any[] = [];
  if (article.product.autoPublish) {
    try {
      // Get all credentials for this product
      const credentials = await prisma.credential.findMany({
        where: {
          productId: article.product.id,
        },
      });

      // Publish to each credential
      for (const credential of credentials) {
        const publisher = getPublisher(credential.type);

        if (publisher) {
          const publishResult = await publisher.publish(
            {
              title: result.title,
              metaDescription: result.metaDescription,
              content: result.content,
              keyword: article.keyword,
              imageUrl: featuredImageUrl,
            },
            {
              type: credential.type,
              accessToken: credential.accessToken,
              config: credential.config,
            }
          );

          if (publishResult.success) {
            // Create publication record
            const publication = await prisma.publication.create({
              data: {
                articleId,
                credentialId: credential.id,
                url: publishResult.url,
              },
            });
            publications.push(publication);
          } else {
            console.error(
              `Failed to publish to ${credential.type}:`,
              publishResult.error
            );
          }
        }
      }

      // Update article status to G if at least one publication succeeded
      if (publications.length > 0) {
        await prisma.article.update({
          where: { id: articleId },
          data: { status: 'published' },
        });
        console.log(
          `✅ Article auto-published to ${publications.length} destination(s)`
        );
      }
    } catch (publishError) {
      console.error('Error during auto-publish:', publishError);
      // Don't fail the whole operation if publishing fails
    }
  }

  return {
    success: true,
    article: updatedArticle,
    metaDescription: result.metaDescription,
    slug: result.slug,
    publications,
  };
};

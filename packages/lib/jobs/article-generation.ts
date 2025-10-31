import prisma from '@workspace/db/prisma/client';
import type { Job, Publication } from '@workspace/db/prisma/generated/client';
import { ArticleGeneratedEmail, send } from '@workspace/emails';
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
      product: {
        include: {
          organization: {
            include: {
              members: { include: { user: true } },
            },
          },
        },
      },
    },
  });

  // Prepare workflow input
  const workflowInput = {
    articleId,
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
      title: result.articleContent?.title || '',
      slug: result.articleContent?.slug,
      metaDescription: result.articleContent?.metaDescription,
      content: result.articleContent?.content,
      featuredImageUrl: featuredImageUrl,
      status: 'generated',
    },
  });

  console.log(
    `✅ Article content generated and saved for article ${articleId}`
  );

  // Notify organization members that an article has been generated (only those with email preferences enabled)
  try {
    const dashboardUrl =
      process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://app.lovarank.com';
    const recipientEmails = Array.from(
      new Set(
        (article?.product?.organization?.members || [])
          .filter((m) => m.user?.emailNotificationsArticleGenerated !== false)
          .map((m) => m.user?.email)
          .filter((e): e is string => !!e)
      )
    );

    if (recipientEmails.length > 0) {
      await Promise.all(
        recipientEmails.map((to) =>
          send({
            from: `Lovarank <${process.env.EMAIL_FROM as string}>`,
            to,
            replyTo: 'support@lovarank.com',
            subject: 'New blog post generated',
            react: ArticleGeneratedEmail({
              productName: article?.product?.name,
              articleTitle: updatedArticle.title,
              dashboardUrl,
            }) as any,
          })
        )
      );
    }
  } catch (emailError) {
    console.error(
      'Failed to send article generated notification emails:',
      emailError
    );
  }

  // Auto-publish if enabled
  const publications: Publication[] = [];
  if (article?.product?.autoPublish) {
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

        if (publisher && credential.type !== 'framer') {
          const publishResult = await publisher.publish(
            {
              title: result.articleContent?.title || '',
              metaDescription: result.articleContent?.metaDescription || '',
              content: result.articleContent?.content || '',
              keyword: article.keyword,
              imageUrl: featuredImageUrl!,
              createdAt: article.createdAt.toISOString(),
              slug: article.slug!,
              status: article.status,
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
    metaDescription: result.articleContent?.metaDescription,
    slug: result.articleContent?.slug,
    publications,
  };
};

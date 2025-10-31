import prisma from '@workspace/db/prisma/client';
import { Job } from '@workspace/db/prisma/generated/client';
import { ContentPlannerReadyEmail, send } from '@workspace/emails';
import { mastra } from '../mastra';

export const contentPlanner = async (job: Job) => {
  const productId = job.productId;

  if (!productId) {
    throw new Error('No product ID provided');
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      organization: {
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }

  const workflow = mastra.getWorkflow('keywordIdeasGeneratorWorkflow');
  const run = await workflow.createRunAsync();

  const workflowResult = await run.start({
    inputData: {
      id: product.id,
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
  if (productId && !!result?.keywords?.length) {
    const articles = await prisma.article.createMany({
      data: result.keywords.map((idea) => ({
        productId: productId,
        keyword: idea.keyword,
        // type: idea.type,
        // guideSubtype: idea.type === 'guide' ? idea.guideSubtype : null,
        // listicleSubtype: idea.type === 'listicle' ? idea.listicleSubtype : null,
        searchVolume: idea.searchVolume,
        keywordDifficulty: idea.keywordDifficulty,
        // cpc: idea.cpc,
        competition: idea.competitionLevel,
        scheduledDate: idea.scheduledDate!,
        status: 'pending',
      })),
    });

    console.log(`✅ Saved ${articles.count} articles to database`);

    // Send transactional email to all organization members with access and email preferences enabled
    try {
      const dashboardUrl =
        process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://app.lovarank.com';
      const recipientEmails = Array.from(
        new Set(
          (product.organization?.members || [])
            .filter((m) => m.user?.emailNotificationsContentPlanner !== false)
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
              subject: 'Your content plan is ready',
              react: ContentPlannerReadyEmail({
                productName: product.name,
                articleCount: articles.count,
                dashboardUrl,
              }) as any,
            })
          )
        );
      }
    } catch (emailError) {
      console.error(
        'Failed to send content planner notification emails:',
        emailError
      );
    }
  }
};

'use server';

import prisma from '@workspace/db/prisma/client';
import getSession from '../get-session';
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export async function generateArticleContent({
  articleId,
}: {
  articleId: string;
}) {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  try {
    // Verify the article belongs to a product the user has access to
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        product: {
          include: {
            organization: {
              include: {
                members: {
                  where: {
                    userId: session.user.id,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!article) {
      throw new Error('Article not found');
    }

    if (article.product.organization.members.length === 0) {
      throw new Error('Unauthorized to access this article');
    }

    // Prepare data for the workflow
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

    // Create AI agent for content generation
    const contentWriter = new Agent({
      name: 'SEO Content Writer',
      instructions: `You are an expert content writer specializing in SEO-optimized articles that sound natural and human-written. 

Your writing must:
- Sound conversational and authentic, not robotic or formulaic
- Vary sentence structure and length naturally
- Include specific examples, data points, and actionable insights
- Avoid AI clichés like "In today's digital age", "It's important to note", "In conclusion", "Delve into", "Unlock", "Revolutionize"
- Use natural transitions that flow logically
- Write with authority and expertise, but remain approachable
- Include personal insights and nuanced perspectives when appropriate
- Balance informative content with engaging storytelling

Never write content that feels like it came from a template or AI generator.`,
      model: openai('gpt-4o'),
    });

    const { articleData, productData } = workflowInput;

    // Build comprehensive prompt
    const prompt = `You are writing an SEO-optimized article that must sound completely natural and human-written.

## ARTICLE DETAILS

**Target Keyword**: ${articleData.keyword}
**Article Title**: ${articleData.title || `Generate an engaging, SEO-optimized title based on the keyword`}
**Article Type**: ${articleData.type}${articleData.guideSubtype ? ` (${articleData.guideSubtype})` : ''}${articleData.listicleSubtype ? ` (${articleData.listicleSubtype})` : ''}

**SEO Metrics**:
- Search Volume: ${articleData.searchVolume || 'Unknown'}
- Keyword Difficulty: ${articleData.keywordDifficulty || 'Unknown'}

## PRODUCT/BRAND CONTEXT

**Product/Brand**: ${productData.name || 'Not specified'}
**Description**: ${productData.description || 'Not specified'}
**Website**: ${productData.url}
**Target Audiences**: ${productData.targetAudiences.join(', ')}
**Language**: ${productData.language || 'en'}
**Country**: ${productData.country || 'US'}

## CONTENT PREFERENCES

**Writing Style**: ${productData.articleStyle}
${productData.globalInstructions ? `**Custom Instructions**: ${productData.globalInstructions}` : ''}

Write a comprehensive, SEO-optimized article (1500-3000 words) that:
1. Includes the target keyword naturally throughout
2. Provides genuine value and actionable insights
3. Matches the article type and subtype structure
4. Sounds completely human-written (no AI clichés)
5. Uses proper markdown formatting

Return the article with:
- A compelling H1 title
- Well-structured content with H2/H3 headings
- Lists, examples, and formatting for readability
- Natural keyword integration`;

    // Generate content with AI
    const aiResult = await contentWriter.generateVNext(prompt, {
      output: z.object({
        title: z.string().describe('The final article title (H1)'),
        content: z
          .string()
          .describe(
            'Complete article content in markdown format, including all sections and formatting'
          ),
        metaDescription: z
          .string()
          .describe('SEO meta description, 150-160 characters'),
        slug: z.string().describe('URL-friendly slug'),
      }),
    });

    const result = {
      articleId,
      title: aiResult.object.title,
      content: aiResult.object.content,
      metaDescription: aiResult.object.metaDescription,
      slug: aiResult.object.slug,
    };

    // Update the article with the generated content
    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        title: result.title,
        content: result.content,
        status: 'generated',
      },
    });

    return {
      success: true,
      article: updatedArticle,
      metaDescription: result.metaDescription,
      slug: result.slug,
    };
  } catch (error) {
    console.error('Error generating article content:', error);

    // Update article status to indicate failure
    await prisma.article.update({
      where: { id: articleId },
      data: { status: 'failed' },
    });

    throw new Error(
      `Failed to generate article content: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export default generateArticleContent;

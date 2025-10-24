import { z } from 'zod';
import { ArticleSchema, ProductSchema } from '../../dtos';

// Input schema - now accepts the full data instead of just ID
export const WorkflowInputSchema = z.object({
  articleId: z.string(),
});

// Competitive Brief Schema
export const CompetitiveBriefSchema = z.object({
  targetInformation: z.object({
    primaryKeyword: z.string(),
    lsiKeywords: z.array(z.string()),
    searchIntent: z.string(),
  }),
  competitiveAnalysis: z.object({
    targetWordCountMin: z.number(),
    targetWordCountMax: z.number(),
    topPages: z.array(
      z.object({
        url: z.string(),
        title: z.string(),
        wordCount: z.number(),
        mainPoints: z.array(z.string()),
        headings: z.array(z.string()),
      })
    ),
    contentGaps: z.array(z.string()),
    unansweredQuestions: z.array(z.string()),
  }),
  contentStructure: z.object({
    requiredSections: z.array(z.string()),
    keywordPlacements: z.array(z.string()),
    imageSuggestions: z.array(z.string()),
    internalLinkingOpportunities: z.array(z.string()),
  }),
  technicalElements: z.object({
    titleTagGuidelines: z.string(),
    metaDescriptionGuidelines: z.string(),
    schemaMarkupType: z.string(),
    headerHierarchy: z.string(),
  }),
});

// SERP Result Schema
export const SerpResultSchema = z.object({
  position: z.number(),
  url: z.string(),
  title: z.string(),
  description: z.string().optional(),
  html: z.string().optional(),
});

// Existing Article Schema
export const ExistingArticleSchema = z.object({
  id: z.string().optional(), // Optional because sitemap links don't have an id
  title: z.string(),
  keyword: z.string(),
  url: z.string(),
});

// Competitor Content Schema
export const CompetitorContentSchema = z.object({
  url: z.string(),
  title: z.string(),
  metaDescription: z.string(),
  headings: z.array(z.string()),
  wordCount: z.number(),
  contentPreview: z.string(),
});

// Article Content Schema (intermediate schema without images)
export const ArticleContentSchema = z.object({
  articleId: z.string(),
  title: z.string(),
  content: z.string().describe('Complete article content in markdown format'),
  metaDescription: z
    .string()
    .describe('SEO meta description (150-160 characters)'),
  slug: z.string().describe('URL-friendly slug'),
});

// Image Plan Schema
export const ImagePlanSchema = z.object({
  type: z.enum(['hero', 'section', 'diagram']),
  placement: z.string(),
  prompt: z.string(),
  altText: z.string(),
  styleModifier: z.string().optional(),
});

// Generated Image Schema
export const GeneratedImageSchema = z.object({
  url: z.string().describe('Generated image URL'),
  type: z.enum(['hero', 'section', 'diagram']).describe('Type of image'),
  placement: z
    .string()
    .describe('Where in the article this image should be placed'),
  altText: z.string().describe('SEO-optimized alt text for the image'),
});

// Output schema (final output with images)
export const WorkflowOutputSchema = ArticleContentSchema.extend({
  images: z
    .array(GeneratedImageSchema)
    .describe('Generated images for the article'),
});

export const WorkflowDTO = WorkflowInputSchema.extend({
  product: ProductSchema.nullish(),
  article: ArticleSchema.nullish(),
  serpResults: z.array(SerpResultSchema).nullish(),
  existingArticles: z.array(ExistingArticleSchema).nullish(),
  competitorContent: z.array(CompetitorContentSchema).nullish(),
  competitiveBrief: CompetitiveBriefSchema.nullish(),

  articleContent: z
    .object({
      title: z.string(),
      content: z.string(),
      metaDescription: z.string(),
      slug: z.string(),
    })
    .nullish(),

  imagePlan: z.array(ImagePlanSchema).nullish(),
  images: z.array(GeneratedImageSchema).nullish(),
});

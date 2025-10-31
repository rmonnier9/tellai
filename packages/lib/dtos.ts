import type { Article, Product } from '@workspace/db/prisma/generated/client';
import { JobType } from '@workspace/db/prisma/generated/enums';
import { z } from 'zod';

export const CreateProductSchema = z.object({
  name: z.string().min(3),
  description: z.string().nullable(),
  url: z.string().url(),
});

export type CreateProductSchema = z.infer<typeof CreateProductSchema>;

export const OnboardingProductSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  language: z.string().min(2, 'Please enter a language code'),
  country: z.string().min(2, 'Please enter a country code'),
  logo: z.string().optional(),
  targetAudiences: z
    .array(z.string())
    .min(1, 'Add at least one target audience'),
  competitors: z.array(z.string().url()).min(3).max(7).optional(),
  sitemapUrl: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  blogUrl: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  bestArticles: z.array(z.string()).max(3, 'Maximum 3 articles').optional(),
  // Article preferences
  autoPublish: z.boolean(),
  articleStyle: z.enum([
    'informative',
    'narrative',
    'listicle',
    'howto',
    'opinion',
  ]),
  internalLinks: z.number().min(0).max(10),
  globalInstructions: z.string().optional().or(z.literal('')),
  imageStyle: z.enum([
    'brand-text',
    'watercolor',
    'cinematic',
    'illustration',
    'sketch',
  ]),
  brandColor: z.string(),
  includeYoutubeVideo: z.boolean(),
  includeCallToAction: z.boolean(),
  includeInfographics: z.boolean(),
  includeEmojis: z.boolean(),
});

export type OnboardingProductSchema = z.infer<typeof OnboardingProductSchema>;

// Update Product Schema (same as OnboardingProductSchema but without URL since it can't be changed)
export const UpdateProductSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  language: z.string().min(2, 'Please enter a language code'),
  country: z.string().min(2, 'Please enter a country code'),
  logo: z.string().optional(),
  targetAudiences: z
    .array(z.string())
    .min(1, 'Add at least one target audience'),
  competitors: z.array(z.string()).max(7, 'Maximum 7 competitors').optional(),
  sitemapUrl: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  blogUrl: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  bestArticles: z.array(z.string()).max(3, 'Maximum 3 articles').optional(),
  // Article preferences
  autoPublish: z.boolean(),
  articleStyle: z.enum([
    'informative',
    'narrative',
    'listicle',
    'howto',
    'opinion',
  ]),
  internalLinks: z.number().min(0).max(10),
  globalInstructions: z.string().optional().or(z.literal('')),
  imageStyle: z.enum([
    'brand-text',
    'watercolor',
    'cinematic',
    'illustration',
    'sketch',
  ]),
  brandColor: z.string(),
  includeYoutubeVideo: z.boolean(),
  includeCallToAction: z.boolean(),
  includeInfographics: z.boolean(),
  includeEmojis: z.boolean(),
});

export type UpdateProductSchema = z.infer<typeof UpdateProductSchema>;

// Credential Schemas
export const ShopifyCredentialSchema = z.object({
  name: z.string().min(1, 'Integration name is required'),
  storeName: z.string().min(1, 'Store name is required'),
  accessToken: z.string().min(1, 'Access token is required'),
  blogId: z.string().min(1, 'Blog ID is required'),
  authorName: z.string().min(1, 'Author name is required'),
  publishingStatus: z.enum(['published', 'draft']),
});

export type ShopifyCredentialSchema = z.infer<typeof ShopifyCredentialSchema>;

export const WordPressCredentialSchema = z.object({
  name: z.string().min(1, 'Integration name is required'),
  siteUrl: z.string().url('Please enter a valid URL'),
  applicationPassword: z.string().min(1, 'Application password is required'),
  authorId: z.string().nullish(),
  username: z.string().nullish(),
  publishingStatus: z.enum(['publish', 'draft']),
});

export type WordPressCredentialSchema = z.infer<
  typeof WordPressCredentialSchema
>;

export const WebhookCredentialSchema = z.object({
  name: z.string().min(1, 'Integration name is required'),
  webhookUrl: z.string().url('Please enter a valid webhook URL'),
  secret: z.string().optional(),
  headers: z.string().optional(), // JSON string of headers
});

export type WebhookCredentialSchema = z.infer<typeof WebhookCredentialSchema>;

export const WebflowCredentialSchema = z.object({
  name: z.string().min(1, 'Integration name is required'),
  accessToken: z.string().min(1, 'API token is required'),
  collectionId: z.string().min(1, 'Collection ID is required'),
  siteUrl: z.string().url('Please enter a valid site URL').optional(),
  publishingStatus: z.enum(['live', 'draft', 'staged']),
  fieldMapping: z.record(z.string(), z.string()).optional(),
});

export type WebflowCredentialSchema = z.infer<typeof WebflowCredentialSchema>;

export const FramerCredentialSchema = z.object({
  name: z.string().min(1, 'Integration name is required'),
  apiKey: z.string().min(1, 'API key is required'),
});

export type FramerCredentialSchema = z.infer<typeof FramerCredentialSchema>;

export const QueueInputSchema = z.object({
  apiUrl: z.string(),
  body: z.any(),
});

export type QueueInputSchema = z.infer<typeof QueueInputSchema>;

export const EnqueueJobSchema = z.object({
  jobType: z.nativeEnum(JobType).nullish(),
  productId: z.string().nullish(),
  articleId: z.string().nullish(),
  userId: z.string().nullish(),
});

export type EnqueueJobSchema = z.infer<typeof EnqueueJobSchema>;

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  url: z.string(),
  description: z.string().nullable(),
  logo: z.string().nullable(),
  language: z.string().nullable(),
  country: z.string().nullable(),
  targetAudiences: z.array(z.string()),
  sitemapUrl: z.string().nullable(),
  blogUrl: z.string().nullable(),
  bestArticles: z.array(z.string()),
  linkSource: z.string(),
  detectedLinks: z.object({}).nullable(),
  totalUrlsDetected: z.number().nullable(),
  autoPublish: z.boolean(),
  articleStyle: z.string(),
  internalLinks: z.number(),
  globalInstructions: z.string().nullable(),
  imageStyle: z.string(),
  brandColor: z.string(),
  includeYoutubeVideo: z.boolean(),
  includeCallToAction: z.boolean(),
  includeInfographics: z.boolean(),
  includeEmojis: z.boolean(),
  subscriptionId: z.string().nullable(),
  organizationId: z.string(),
  competitors: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
}) satisfies z.ZodType<Product>;

export const ArticleSchema = z.object({
  id: z.string(),
  slug: z.string().nullable(),
  productId: z.string(),
  product: ProductSchema,
  keyword: z.string(),
  title: z.string().nullable(),
  type: z.enum(['guide', 'listicle']),
  guideSubtype: z
    .enum(['how_to', 'explainer', 'comparison', 'reference'])
    .nullable(),
  listicleSubtype: z.enum(['round_up', 'resources', 'examples']).nullable(),
  contentLength: z
    .enum(['short', 'medium', 'long', 'comprehensive'])
    .nullable(),
  searchVolume: z.number().nullable(),
  keywordDifficulty: z.number().nullable(),
  cpc: z.number().nullable(),
  competition: z.string().nullable(),
  scheduledDate: z.date(),
  status: z.enum(['pending', 'generated', 'published']),
  content: z.string().nullable(),
  metaDescription: z.string().nullable(),
  publishedUrl: z.string().nullable(),
  featuredImageUrl: z.string().nullable(),
  publications: z.array(z.any()),
  jobs: z.array(z.any()),
  createdAt: z.date(),
  updatedAt: z.date(),
}) satisfies z.ZodType<Article>;

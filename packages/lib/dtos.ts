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
  username: z.string().min(1, 'Username is required'),
  applicationPassword: z.string().min(1, 'Application password is required'),
  authorId: z.string().optional(),
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

export const QueueInputSchema = z.object({
  apiUrl: z.string(),
  body: z.any(),
});

export type QueueInputSchema = z.infer<typeof QueueInputSchema>;

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

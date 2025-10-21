import { z } from 'zod';
import { ProductSchema } from '../../dtos';

export const CurrentKeywordSchema = z.object({
  keyword: z.string(),
  position: z.number(),
  searchVolume: z.number(),
  intent: z.string(),
});

export const CompetitorSchema = z.object({
  domain: z.string(),
  keywords: z.array(
    z.object({
      keyword: z.string(),
      searchVolume: z.number().nullable(),
      position: z.number(),
      difficulty: z.number().nullable(),
    })
  ),
});

export const DataForSEOLabsKeywordSchema = z.object({
  keyword: z.string(),
  searchVolume: z.number().nullish(),
  position: z.number().nullish(),
  intent: z.string().nullish(),
  competitionLevel: z.string().nullish(),
  keywordDifficulty: z.number().nullish(),
});

export const FinalKeywordSchema = DataForSEOLabsKeywordSchema.extend({
  scheduledDate: z.date().nullish(),
});

export const WorkflowDTO = z.object({
  product: ProductSchema.nullish(),
  seedKeywords: z.array(z.string()).nullish(),
  customerRankedKeywords: z.array(DataForSEOLabsKeywordSchema).nullish(),
  competitorsKeywords: z.array(DataForSEOLabsKeywordSchema).nullish(),
  competitorsKeywordsGaps: z.array(DataForSEOLabsKeywordSchema).nullish(),
  growedSeedKeywords: z.array(DataForSEOLabsKeywordSchema).nullish(),
  keywords: z.array(FinalKeywordSchema).nullish(),

  googleAdsKeywords: z.array(z.string()).nullish(),
  totalCostDataForSEO: z.number().nullish(),
  keywordsBlacklist: z.array(z.string()).nullish(),
  websiteAnalysis: z.string().nullish(),
  currentKeywords: z.array(CurrentKeywordSchema).nullish(),
  competitors: z.array(CompetitorSchema).nullish(),
  rawKeywordData: z.array(z.any()).nullish(),
});

export const WorkflowInputSchema = WorkflowDTO.extend({
  id: z.string(),
  // name: z.string(),
  // description: z.string(),
  // country: z.string(),
  // language: z.string(),
  // targetAudiences: z.array(z.string()),
  // url: z.string(),
  // blogUrl: z.string().nullable(),
});

export const KeywordOpportunitySchema = z.object({
  keyword: z.string(),
  searchVolume: z.number(),
  keywordDifficulty: z.number().nullable(),
  cpc: z.number().nullable(),
  competition: z.string().nullable(),
  searchIntent: z.string().nullable(),
  trend: z
    .object({
      monthly: z.number().nullable(),
      quarterly: z.number().nullable(),
      yearly: z.number().nullable(),
    })
    .nullable(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  category: z.string(),
  scheduledDate: z.string(),
});

export const WorkflowOutputSchema = z.object({
  productId: z.string(),
  keywords: z.array(FinalKeywordSchema),
});

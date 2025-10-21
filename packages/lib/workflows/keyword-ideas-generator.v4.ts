import { createWorkflow, createStep } from '@mastra/core/workflows';
import { Agent } from '@mastra/core/agent';
import { z } from 'zod';
import * as DataForSEO from 'dataforseo-client';
import prisma from '@workspace/db/prisma/client';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { getDataForSEOClient, getLocationCode } from '../dataforseo';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// ============================================================================
// CONSTANTS
// ============================================================================
const TARGET_KEYWORDS_COUNT = 30;
const MIN_SEARCH_VOLUME = 50;
const TOP_3_CTR = 0.35; // Assume 35% CTR for top 3 positions

// ============================================================================
// SCHEMAS & TYPES
// ============================================================================

const SearchIntentEnum = z.enum([
  'informational',
  'navigational',
  'commercial',
  'transactional',
]);

const BusinessPotentialEnum = z.enum(['0', '1', '2', '3']);
const ArticleTypeEnum = z.enum(['guide', 'listicle']);

const ProductInputSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  country: z.string(),
  language: z.string(),
  targetAudiences: z.array(z.string()),
  url: z.string(),
});

const KeywordDiscoverySchema = z.object({
  keyword: z.string(),
  searchVolume: z.number(),
  keywordDifficulty: z.number(),
  cpc: z.number().optional(),
  competition: z.number().optional(),
  searchIntent: SearchIntentEnum,
  businessPotential: BusinessPotentialEnum,
  trafficPotential: z.number(),
  parentTopic: z.string().optional(),
  trendScore: z.number().optional(),
  competitorGap: z.boolean(),
  priorityScore: z.number(),
  trafficDifficultyRatio: z.number(),
  rationale: z.string(),
  recommendedContentType: ArticleTypeEnum,
  recommendedSubtype: z.string(),
  contentTypeRationale: z.string(),
  scheduledDate: z.string(),
});

const OutputSchema = z.object({
  productId: z.string(),
  keywords: z.array(KeywordDiscoverySchema),
  totalKeywords: z.number(),
  stats: z.object({
    avgSearchVolume: z.number(),
    avgDifficulty: z.number(),
    avgPriorityScore: z.number(),
    highBusinessPotential: z.number(),
    competitorGaps: z.number(),
    totalTrafficPotential: z.number(),
  }),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const estimateTrafficPotential = (searchVolume: number): number => {
  return Math.round(searchVolume * TOP_3_CTR);
};

// ============================================================================
// AI AGENTS
// ============================================================================

const keywordStrategistAgent = new Agent({
  name: 'Keyword Strategist',
  instructions: `You are an SEO expert specializing in keyword research.
  Generate seed keywords that are:
  - Relevant to the business
  - Informational/educational in nature
  - Avoid commercial intent (buy, best, price, top)
  - In the specified language
  Always return a valid JSON array of strings.`,
  model: openrouter('anthropic/claude-4.5-sonnet'),
});

const keywordAnalysisAgent = new Agent({
  name: 'Keyword Analysis Strategist',
  instructions: `You are an SEO and business strategist. Analyze keywords for search intent, business potential, and content recommendations.`,
  model: openrouter('anthropic/claude-4.5-sonnet'),
});

// ============================================================================
// STEP 1: FETCH EXISTING KEYWORDS
// ============================================================================

const fetchExistingKeywordsStep = createStep({
  id: 'fetch-existing-keywords',
  inputSchema: ProductInputSchema,
  outputSchema: z.object({
    product: ProductInputSchema,
    existingKeywords: z.array(z.string()),
  }),
  execute: async ({ inputData }) => {
    console.log(
      `\n🔍 Fetching existing articles for product: ${inputData.name}`
    );

    try {
      const existingArticles = await prisma.article.findMany({
        where: { productId: inputData.id },
        select: { keyword: true },
      });

      const existingKeywords = existingArticles.map((article) =>
        article.keyword.toLowerCase().trim()
      );

      console.log(
        `✅ Found ${existingKeywords.length} existing keywords to exclude`
      );

      return {
        product: inputData,
        existingKeywords,
      };
    } catch (error) {
      console.warn(
        'Failed to fetch existing articles, continuing without deduplication:',
        error
      );
      return {
        product: inputData,
        existingKeywords: [],
      };
    }
  },
});

// ============================================================================
// STEP 2: GENERATE SEED KEYWORDS
// ============================================================================

const generateSeedKeywords = createStep({
  id: 'generate-seed-keywords',
  inputSchema: z.object({
    product: ProductInputSchema,
    existingKeywords: z.array(z.string()),
  }),
  outputSchema: z.object({
    product: ProductInputSchema,
    existingKeywords: z.array(z.string()),
    seedKeywords: z.array(z.string()),
  }),
  execute: async ({ inputData }) => {
    const { product, existingKeywords } = inputData;

    console.log(`\n🤖 Generating seed keywords with AI...`);

    const prompt = `Based on this business analysis, generate 10-15 seed keywords in ${product.language} for keyword research.
      
Name: ${product.name}
Description: ${product.description}
Target Audience: ${product.targetAudiences.join(', ')}
Website: ${product.url}
      
Focus on:
- Core business activities
- Industry-specific terms
- Problem-solving keywords
- Educational/informational topics
      
AVOID:
- Brand names
- Commercial/transactional keywords (buy, price, best, top)
- Product comparison keywords
      
Return only a JSON array of strings: ["keyword1", "keyword2", ...]`;

    try {
      const result = await keywordStrategistAgent.generateVNext(prompt, {
        output: z.object({
          keywords: z.array(z.string()).describe('Seed keywords for research'),
        }),
      });

      const seedKeywords = result.object.keywords
        .map((kw) => kw.toLowerCase().trim())
        .filter((kw) => !existingKeywords.includes(kw));

      console.log(`✅ Generated ${seedKeywords.length} seed keywords`);

      return {
        product,
        existingKeywords,
        seedKeywords,
      };
    } catch (error) {
      console.error('Failed to generate seed keywords:', error);
      // Fallback: use product name and description words as seeds
      const fallbackSeeds = [
        product.name.toLowerCase(),
        ...product.description.toLowerCase().split(' ').slice(0, 5),
      ].filter((kw) => kw.length > 3 && !existingKeywords.includes(kw));

      return {
        product,
        existingKeywords,
        seedKeywords: fallbackSeeds,
      };
    }
  },
});

// ============================================================================
// STEP 3: RESEARCH KEYWORDS (DataForSEO)
// ============================================================================

const researchKeywords = createStep({
  id: 'research-keywords',
  inputSchema: z.object({
    product: ProductInputSchema,
    existingKeywords: z.array(z.string()),
    seedKeywords: z.array(z.string()),
  }),
  outputSchema: z.object({
    product: ProductInputSchema,
    existingKeywords: z.array(z.string()),
    keywords: z.array(z.string()),
  }),
  execute: async ({ inputData }) => {
    const { product, existingKeywords, seedKeywords } = inputData;
    const api = getDataForSEOClient();

    console.log(
      `\n📡 Researching keywords using ${seedKeywords.length} seed keywords...`
    );

    try {
      // 1. Get Keyword Ideas
      const ideasTask =
        new DataForSEO.DataforseoLabsGoogleKeywordIdeasLiveRequestInfo();
      ideasTask.keywords = seedKeywords;
      ideasTask.location_code = getLocationCode(product.country);
      ideasTask.language_code = product.language;
      ideasTask.limit = 100;
      ideasTask.filters = [
        ['keyword_info.search_volume', '>=', MIN_SEARCH_VOLUME],
      ];
      ideasTask.order_by = ['keyword_info.search_volume,desc'];

      const ideasResponse = await api.googleKeywordIdeasLive([ideasTask]);

      const ideas = ideasResponse?.tasks?.[0]?.result?.[0]?.items || [];
      console.log(`✅ Found ${ideas.length} keyword ideas`);

      // 2. Get Keyword Suggestions for top 5 seeds
      const suggestionsPromises = seedKeywords
        .slice(0, 5)
        .map(async (keyword) => {
          const task =
            new DataForSEO.DataforseoLabsGoogleKeywordSuggestionsLiveRequestInfo();
          task.keyword = keyword;
          task.location_code = getLocationCode(product.country);
          task.language_code = product.language;
          task.limit = 50;
          task.order_by = ['keyword_info.search_volume,desc'];

          const response = await api.googleKeywordSuggestionsLive([task]);
          return response?.tasks?.[0]?.result?.[0]?.items || [];
        });

      const suggestionsResults = await Promise.all(suggestionsPromises);
      const suggestions = suggestionsResults.flat();
      console.log(`✅ Found ${suggestions.length} keyword suggestions`);

      // 3. Combine and deduplicate
      const combinedKeywords = [...ideas, ...suggestions];
      const uniqueKeywords = new Map<string, unknown>();

      for (const item of combinedKeywords) {
        const typedItem = item as Record<string, unknown>;
        const keyword = (typedItem.keyword as string)?.toLowerCase().trim();
        if (!keyword || existingKeywords.includes(keyword)) continue;

        if (!uniqueKeywords.has(keyword)) {
          uniqueKeywords.set(keyword, item);
        }
      }

      // 4. Filter for informational intent and good metrics
      const filteredKeywords: string[] = [];

      for (const [keyword, data] of uniqueKeywords) {
        const typedData = data as Record<string, unknown>;
        const searchIntentInfo = typedData.search_intent_info as
          | Record<string, unknown>
          | undefined;
        const keywordInfo = typedData.keyword_info as
          | Record<string, unknown>
          | undefined;
        const keywordProps = typedData.keyword_properties as
          | Record<string, unknown>
          | undefined;

        const searchIntent =
          (searchIntentInfo?.main_intent as string | undefined) || 'unknown';
        const searchVolume =
          (keywordInfo?.search_volume as number | undefined) || 0;
        const competitionLevel =
          (keywordInfo?.competition_level as string | undefined) || 'UNKNOWN';
        const keywordDifficulty = keywordProps?.keyword_difficulty as
          | number
          | undefined;

        // Filter criteria
        const isInformational = ['informational', 'navigational'].includes(
          searchIntent.toLowerCase()
        );
        const hasGoodVolume = searchVolume >= MIN_SEARCH_VOLUME;
        const hasLowCompetition = ['LOW', 'MEDIUM'].includes(competitionLevel);
        const hasLowDifficulty = !keywordDifficulty || keywordDifficulty <= 50;

        if (
          isInformational &&
          hasGoodVolume &&
          hasLowCompetition &&
          hasLowDifficulty
        ) {
          filteredKeywords.push(keyword);
        }
      }

      console.log(
        `✅ Filtered to ${filteredKeywords.length} informational, low-competition keywords`
      );

      // Take top TARGET_KEYWORDS_COUNT * 2 to allow for further filtering
      const topKeywords = filteredKeywords.slice(0, TARGET_KEYWORDS_COUNT * 2);

      return {
        product,
        existingKeywords,
        keywords: topKeywords,
      };
    } catch (error) {
      console.error('Failed to research keywords:', error);
      // Fallback: just use seed keywords
      return {
        product,
        existingKeywords,
        keywords: seedKeywords.slice(0, TARGET_KEYWORDS_COUNT),
      };
    }
  },
});

// ============================================================================
// STEP 4: GET BULK KEYWORD DIFFICULTY
// ============================================================================

const getBulkKeywordDifficultyStep = createStep({
  id: 'get-bulk-keyword-difficulty',
  inputSchema: z.object({
    product: ProductInputSchema,
    existingKeywords: z.array(z.string()),
    keywords: z.array(z.string()),
  }),
  outputSchema: z.object({
    product: ProductInputSchema,
    keywordData: z.array(
      z.object({
        keyword: z.string(),
        searchVolume: z.number(),
        difficulty: z.number(),
        cpc: z.number().optional(),
        competition: z.number().optional(),
      })
    ),
  }),
  execute: async ({ inputData }) => {
    const { product, keywords } = inputData;
    const api = getDataForSEOClient();

    console.log(
      `\n📡 Fetching keyword difficulty for ${keywords.length} keywords...`
    );

    try {
      const task =
        new DataForSEO.DataforseoLabsGoogleBulkKeywordDifficultyLiveRequestInfo();
      task.keywords = keywords;
      task.location_code = getLocationCode(product.country);
      task.language_code = product.language;

      const response = await api.googleBulkKeywordDifficultyLive([task]);

      if (!response?.tasks?.[0]) {
        throw new Error(
          'No data returned from DataForSEO bulk_keyword_difficulty endpoint'
        );
      }

      const taskResult = response.tasks[0];
      if (taskResult.status_code !== 20000) {
        throw new Error(
          `DataForSEO error: ${taskResult.status_message || 'Unknown error'}`
        );
      }

      const items = taskResult.result?.[0]?.items || [];
      console.log(`✅ Received difficulty data for ${items.length} keywords`);

      // Extract keyword data
      const keywordData = items
        .map((item: unknown) => {
          const typedItem = item as Record<string, unknown>;
          const keywordInfo = typedItem.keyword_info as
            | Record<string, unknown>
            | undefined;
          const keywordProps = typedItem.keyword_properties as
            | Record<string, unknown>
            | undefined;

          return {
            keyword: (typedItem.keyword as string | undefined) || '',
            searchVolume:
              (keywordInfo?.search_volume as number | undefined) || 100,
            difficulty:
              (keywordProps?.keyword_difficulty as number | undefined) || 50,
            cpc: (keywordInfo?.cpc as number | undefined) || 0,
            competition:
              (keywordInfo?.competition as number | undefined) || 0.5,
          };
        })
        .filter((kw) => kw.keyword && kw.keyword.length > 0)
        .sort((a, b) => b.searchVolume - a.searchVolume)
        .slice(0, TARGET_KEYWORDS_COUNT);

      console.log(
        `✅ Filtered to ${keywordData.length} keywords with valid data`
      );

      return {
        product,
        keywordData,
      };
    } catch (error) {
      console.error('Failed to fetch bulk keyword difficulty:', error);
      // Fallback: create basic keyword data without metrics
      return {
        product,
        keywordData: keywords.slice(0, TARGET_KEYWORDS_COUNT).map((kw) => ({
          keyword: kw,
          searchVolume: 100,
          difficulty: 50,
          cpc: 0,
          competition: 0.5,
        })),
      };
    }
  },
});

// ============================================================================
// STEP 5: ANALYZE AND FINALIZE KEYWORDS
// ============================================================================

const analyzeAndFinalizeStep = createStep({
  id: 'analyze-and-finalize',
  inputSchema: z.object({
    product: ProductInputSchema,
    keywordData: z.array(
      z.object({
        keyword: z.string(),
        searchVolume: z.number(),
        difficulty: z.number(),
        cpc: z.number().optional(),
        competition: z.number().optional(),
      })
    ),
  }),
  outputSchema: OutputSchema,
  execute: async ({ inputData }) => {
    const { product, keywordData } = inputData;

    console.log(`\n🤖 Analyzing ${keywordData.length} keywords with AI...`);

    const prompt = `You are an SEO and business strategist. Analyze these keywords for a business.

**BUSINESS CONTEXT:**
Name: ${product.name}
Description: ${product.description}
Target Audiences: ${product.targetAudiences.join(', ')}

**KEYWORDS TO ANALYZE:**
${keywordData
  .slice(0, TARGET_KEYWORDS_COUNT)
  .map(
    (kw, i) =>
      `${i + 1}. "${kw.keyword}" | Volume: ${kw.searchVolume} | Difficulty: ${kw.difficulty}`
  )
  .join('\n')}

**YOUR TASK:**
For EACH keyword, analyze:

1. **searchIntent**: "informational", "navigational", "commercial", or "transactional"

2. **businessPotential**: Rate 0-3 based on business fit:
   - "3" = Perfect fit for target audience
   - "2" = Good fit, relevant
   - "1" = Weak fit, tangentially related
   - "0" = No fit, irrelevant

3. **parentTopic**: Main category (e.g., "email marketing", "customer support")

4. **competitorGap**: true if difficulty < 40 AND volume > 200, else false

5. **rationale**: One sentence explaining business potential

6. **recommendedContentType**: "guide" or "listicle"

7. **recommendedSubtype**:
   - If guide: "how_to", "explainer", "comparison", or "reference"
   - If listicle: "round_up", "resources", or "examples"

8. **contentTypeRationale**: Why this format will rank

Return complete analysis for ALL ${Math.min(keywordData.length, TARGET_KEYWORDS_COUNT)} keywords.`;

    try {
      const result = await keywordAnalysisAgent.generateVNext(prompt, {
        output: z.object({
          analyses: z.array(
            z.object({
              keyword: z.string(),
              searchIntent: SearchIntentEnum,
              businessPotential: BusinessPotentialEnum,
              parentTopic: z.string().optional(),
              competitorGap: z.boolean(),
              rationale: z.string(),
              recommendedContentType: ArticleTypeEnum,
              recommendedSubtype: z.string(),
              contentTypeRationale: z.string(),
            })
          ),
        }),
      });

      // Combine DataForSEO data with AI analysis
      const enrichedKeywords = keywordData
        .slice(0, TARGET_KEYWORDS_COUNT)
        .map((kw, index) => {
          const analysis = result.object.analyses.find(
            (a) => a.keyword.toLowerCase() === kw.keyword.toLowerCase()
          ) || {
            searchIntent: 'informational' as const,
            businessPotential: '2' as const,
            parentTopic: undefined,
            competitorGap: false,
            rationale: 'Relevant to business context',
            recommendedContentType: 'guide' as const,
            recommendedSubtype: 'explainer',
            contentTypeRationale: 'Standard content format',
          };

          const trafficPotential = estimateTrafficPotential(kw.searchVolume);
          const trafficDifficultyRatio =
            kw.searchVolume / Math.max(kw.difficulty, 1);

          // Calculate priority score
          const bpMultiplier =
            analysis.businessPotential === '3'
              ? 1.5
              : analysis.businessPotential === '2'
                ? 1.2
                : analysis.businessPotential === '1'
                  ? 0.8
                  : 0.5;

          const priorityScore = Math.min(
            Math.round(
              (trafficDifficultyRatio * 0.4 +
                kw.searchVolume * 0.03 +
                (kw.cpc || 0) * 5 +
                (analysis.competitorGap ? 20 : 0)) *
                bpMultiplier
            ),
            100
          );

          // Schedule date (1 per day starting today)
          const scheduledDate = new Date();
          scheduledDate.setDate(scheduledDate.getDate() + index);

          return {
            keyword: kw.keyword,
            searchVolume: kw.searchVolume,
            keywordDifficulty: kw.difficulty,
            cpc: kw.cpc || 0,
            competition: kw.competition || 0.5,
            searchIntent: analysis.searchIntent,
            businessPotential: analysis.businessPotential,
            trafficPotential,
            parentTopic: analysis.parentTopic,
            trendScore: undefined,
            competitorGap: analysis.competitorGap,
            priorityScore,
            trafficDifficultyRatio,
            rationale: analysis.rationale,
            recommendedContentType: analysis.recommendedContentType,
            recommendedSubtype: analysis.recommendedSubtype,
            contentTypeRationale: analysis.contentTypeRationale,
            scheduledDate: scheduledDate.toISOString(),
          };
        });

      // Calculate stats
      const stats = {
        avgSearchVolume: Math.round(
          enrichedKeywords.reduce((sum, kw) => sum + kw.searchVolume, 0) /
            enrichedKeywords.length
        ),
        avgDifficulty: Math.round(
          enrichedKeywords.reduce((sum, kw) => sum + kw.keywordDifficulty, 0) /
            enrichedKeywords.length
        ),
        avgPriorityScore: Math.round(
          enrichedKeywords.reduce((sum, kw) => sum + kw.priorityScore, 0) /
            enrichedKeywords.length
        ),
        highBusinessPotential: enrichedKeywords.filter(
          (kw) => kw.businessPotential === '3'
        ).length,
        competitorGaps: enrichedKeywords.filter((kw) => kw.competitorGap)
          .length,
        totalTrafficPotential: enrichedKeywords.reduce(
          (sum, kw) => sum + kw.trafficPotential,
          0
        ),
      };

      console.log(`
📊 KEYWORD DISCOVERY SUMMARY:
- Total Keywords: ${enrichedKeywords.length}
- Avg Search Volume: ${stats.avgSearchVolume.toLocaleString()}/mo
- Avg Difficulty: ${stats.avgDifficulty}/100
- Avg Priority Score: ${stats.avgPriorityScore}/100
- High Business Potential (BP=3): ${stats.highBusinessPotential}
- Competitor Gap Opportunities: ${stats.competitorGaps}
- Total Traffic Potential: ${stats.totalTrafficPotential.toLocaleString()}/month

Top 5 Keywords:
${enrichedKeywords
  .slice(0, 5)
  .map(
    (kw, i) =>
      `${i + 1}. ${kw.keyword} (Vol: ${kw.searchVolume}, Diff: ${kw.keywordDifficulty}, BP: ${kw.businessPotential})`
  )
  .join('\n')}
    `);

      return {
        productId: product.id,
        keywords: enrichedKeywords,
        totalKeywords: enrichedKeywords.length,
        stats,
      };
    } catch (error) {
      console.error('Failed to analyze keywords with AI:', error);
      // Fallback: return basic data without AI analysis
      const fallbackKeywords = keywordData
        .slice(0, TARGET_KEYWORDS_COUNT)
        .map((kw, index) => {
          const scheduledDate = new Date();
          scheduledDate.setDate(scheduledDate.getDate() + index);

          return {
            keyword: kw.keyword,
            searchVolume: kw.searchVolume,
            keywordDifficulty: kw.difficulty,
            cpc: kw.cpc || 0,
            competition: kw.competition || 0.5,
            searchIntent: 'informational' as const,
            businessPotential: '2' as const,
            trafficPotential: estimateTrafficPotential(kw.searchVolume),
            parentTopic: undefined,
            trendScore: undefined,
            competitorGap: false,
            priorityScore: 50,
            trafficDifficultyRatio:
              kw.searchVolume / Math.max(kw.difficulty, 1),
            rationale: 'Relevant to business',
            recommendedContentType: 'guide' as const,
            recommendedSubtype: 'explainer',
            contentTypeRationale: 'Standard format',
            scheduledDate: scheduledDate.toISOString(),
          };
        });

      return {
        productId: product.id,
        keywords: fallbackKeywords,
        totalKeywords: fallbackKeywords.length,
        stats: {
          avgSearchVolume: Math.round(
            fallbackKeywords.reduce((sum, kw) => sum + kw.searchVolume, 0) /
              fallbackKeywords.length
          ),
          avgDifficulty: Math.round(
            fallbackKeywords.reduce(
              (sum, kw) => sum + kw.keywordDifficulty,
              0
            ) / fallbackKeywords.length
          ),
          avgPriorityScore: 50,
          highBusinessPotential: 0,
          competitorGaps: 0,
          totalTrafficPotential: fallbackKeywords.reduce(
            (sum, kw) => sum + kw.trafficPotential,
            0
          ),
        },
      };
    }
  },
});

// ============================================================================
// WORKFLOW DEFINITION
// ============================================================================

export const keywordIdeasGeneratorWorkflow = createWorkflow({
  id: 'keyword-ideas-generator',
  description: `
    Streamlined Keyword Discovery Workflow:
    
    1. Fetch existing keywords from database to avoid duplicates
    2. Generate seed keywords based on product data using AI (Claude 4.5 Sonnet)
    3. Research keywords using DataForSEO (keyword_ideas + keyword_suggestions)
    4. Get bulk keyword difficulty and metrics (DataForSEO bulk_keyword_difficulty)
    5. Analyze with AI and return 30 unique, relevant keywords
    
    OUTPUT: 30 unique keywords with search volume, difficulty, business potential, and content recommendations
  `,
  inputSchema: ProductInputSchema,
  outputSchema: OutputSchema,
})
  .then(fetchExistingKeywordsStep)
  .then(generateSeedKeywords)
  .then(researchKeywords)
  .then(getBulkKeywordDifficultyStep)
  .then(analyzeAndFinalizeStep)
  .commit();

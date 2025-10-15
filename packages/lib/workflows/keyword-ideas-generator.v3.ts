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

// ============================================
// CONSTANTS
// ============================================
const TARGET_KEYWORDS_COUNT = 30;
const MIN_SEARCH_VOLUME = 50;
const TOP_3_CTR = 0.35; // Assume 35% CTR for top 3 positions

// ============================================
// SCHEMA DEFINITIONS
// ============================================

const SearchIntentEnum = z.enum([
  'informational',
  'navigational',
  'commercial',
  'transactional',
]);

const BusinessPotentialEnum = z.enum(['0', '1', '2', '3']);
const ArticleTypeEnum = z.enum(['guide', 'listicle']);

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

const ProductInputSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  country: z.string(),
  language: z.string(),
  targetAudiences: z.array(z.string()),
  url: z.string(),
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

// ============================================
// HELPER FUNCTIONS
// ============================================

const estimateTrafficPotential = (searchVolume: number): number => {
  return Math.round(searchVolume * TOP_3_CTR);
};

const keywordExpansionAgent = new Agent({
  name: 'Keyword Expansion Strategist',
  instructions: `You are a keyword research expert. Generate relevant keyword variations based on seed keywords and business context.`,
  model: openrouter('anthropic/claude-3.5-sonnet'),
});

const keywordAnalysisAgent = new Agent({
  name: 'Keyword Analysis Strategist',
  instructions: `You are an SEO and business strategist. Analyze keywords for search intent, business potential, and content recommendations.`,
  model: openrouter('anthropic/claude-3.5-sonnet'),
});

// ============================================
// WORKFLOW STEPS
// ============================================

// Step 1: Fetch existing articles to avoid duplicates
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

// Step 2: Get low competition keywords from customer's website
const getKeywordsForSiteStep = createStep({
  id: 'get-keywords-for-site',
  inputSchema: z.object({
    product: ProductInputSchema,
    existingKeywords: z.array(z.string()),
  }),
  outputSchema: z.object({
    product: ProductInputSchema,
    existingKeywords: z.array(z.string()),
    siteKeywords: z.array(
      z.object({
        keyword: z.string(),
        searchVolume: z.number(),
        competition: z.string().optional(),
        cpc: z.number().optional(),
      })
    ),
  }),
  execute: async ({ inputData }) => {
    const { product, existingKeywords } = inputData;
    const api = getDataForSEOClient();

    console.log(`\n📡 Fetching low competition keywords for: ${product.url}`);

    try {
      const task =
        new DataForSEO.DataforseoLabsGoogleKeywordsForSiteLiveRequestInfo();
      task.target = product.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
      task.location_code = getLocationCode(product.country);
      task.language_code = product.language || 'en';
      task.include_serp_info = true;
      task.include_subdomains = true;
      task.limit = 100;
      task.filters = [
        ['keyword_data.keyword_info.search_volume', '>=', MIN_SEARCH_VOLUME],
        ['keyword_data.keyword_info.competition_level', '=', 'LOW'],
      ];

      const response = await api.googleKeywordsForSiteLive([task]);

      if (!response?.tasks?.[0]) {
        throw new Error(
          'No data returned from DataForSEO keywords_for_site endpoint'
        );
      }

      const taskResult = response.tasks[0];
      if (taskResult.status_code !== 20000) {
        throw new Error(
          `DataForSEO error: ${taskResult.status_message || 'Unknown error'}`
        );
      }

      const items = taskResult.result?.[0]?.items || [];
      console.log(
        `✅ Found ${items.length} low competition keywords from site`
      );

      // Extract and filter keywords
      const siteKeywords = items
        .filter((item: unknown) => {
          const typedItem = item as Record<string, unknown>;
          const keyword = (typedItem.keyword as string | undefined)
            ?.toLowerCase()
            .trim();
          if (!keyword) return false;

          // Exclude existing keywords
          if (existingKeywords.includes(keyword)) return false;

          const keywordData = typedItem.keyword_data as
            | Record<string, unknown>
            | undefined;
          const keywordInfo = keywordData?.keyword_info as
            | Record<string, unknown>
            | undefined;
          const searchVolume =
            (keywordInfo?.search_volume as number | undefined) || 0;
          return searchVolume >= MIN_SEARCH_VOLUME;
        })
        .map((item: unknown) => {
          const typedItem = item as Record<string, unknown>;
          const keywordData = typedItem.keyword_data as
            | Record<string, unknown>
            | undefined;
          const keywordInfo = keywordData?.keyword_info as
            | Record<string, unknown>
            | undefined;

          return {
            keyword: typedItem.keyword as string,
            searchVolume:
              (keywordInfo?.search_volume as number | undefined) || 0,
            competition: keywordInfo?.competition_level as string | undefined,
            cpc: (keywordInfo?.cpc as number | undefined) || 0,
          };
        })
        .sort((a, b) => b.searchVolume - a.searchVolume) // Sort by search volume descending
        .slice(0, 50); // Take top 50

      console.log(
        `✅ Filtered to ${siteKeywords.length} unique, low competition keywords`
      );

      return {
        product,
        existingKeywords,
        siteKeywords,
      };
    } catch (error) {
      console.error('Failed to fetch keywords from site:', error);
      // Continue with empty keywords if this fails
      return {
        product,
        existingKeywords,
        siteKeywords: [],
      };
    }
  },
});

// Step 3: Expand keywords with AI if needed
const expandKeywordsStep = createStep({
  id: 'expand-keywords',
  inputSchema: z.object({
    product: ProductInputSchema,
    existingKeywords: z.array(z.string()),
    siteKeywords: z.array(
      z.object({
        keyword: z.string(),
        searchVolume: z.number(),
        competition: z.string().optional(),
        cpc: z.number().optional(),
      })
    ),
  }),
  outputSchema: z.object({
    product: ProductInputSchema,
    existingKeywords: z.array(z.string()),
    allKeywords: z.array(z.string()),
  }),
  execute: async ({ inputData }) => {
    const { product, existingKeywords, siteKeywords } = inputData;

    console.log(`\n🔍 Checking if we need to expand keywords...`);
    console.log(`   • Current keywords from site: ${siteKeywords.length}`);
    console.log(`   • Target: ${TARGET_KEYWORDS_COUNT}`);

    // If we have enough keywords, we're done
    if (siteKeywords.length >= TARGET_KEYWORDS_COUNT) {
      console.log(
        `✅ We have enough keywords! Taking top ${TARGET_KEYWORDS_COUNT}.`
      );
      return {
        product,
        existingKeywords,
        allKeywords: siteKeywords
          .slice(0, TARGET_KEYWORDS_COUNT)
          .map((kw) => kw.keyword),
      };
    }

    // Otherwise, use AI to expand keyword universe
    console.log(`\n🤖 Expanding keyword universe with AI...`);

    const keywordSample = siteKeywords
      .slice(0, 10)
      .map((kw) => kw.keyword)
      .join(', ');

    const prompt = `You are a keyword research expert. Generate ${TARGET_KEYWORDS_COUNT - siteKeywords.length} additional relevant keyword ideas for this business.

**BUSINESS CONTEXT:**
Name: ${product.name}
Description: ${product.description}
Target Audiences: ${product.targetAudiences.join(', ')}
Website: ${product.url}

**EXISTING KEYWORDS (for inspiration):**
${keywordSample}

**YOUR TASK:**
Generate EXACTLY ${TARGET_KEYWORDS_COUNT - siteKeywords.length} new keyword ideas that are:
1. Relevant to the business and target audience
2. Low to medium competition (avoid highly competitive terms)
3. Have commercial or informational intent
4. Different from existing keywords
5. 2-5 words long (mix of short-tail and long-tail)
6. Lowercase

Focus on:
- Problem-solving keywords (how to solve X)
- Solution keywords (best tools for Y)
- Educational keywords (learn about Z)
- Commercial keywords (buy/pricing related)

Return ONLY the keyword list, nothing else.`;

    try {
      const result = await keywordExpansionAgent.generateVNext(prompt, {
        output: z.object({
          keywords: z.array(z.string()).describe('Expanded keyword ideas'),
        }),
      });

      const expandedKeywords = result.object.keywords
        .map((kw) => kw.toLowerCase().trim())
        .filter((kw) => !existingKeywords.includes(kw));

      console.log(
        `✅ Generated ${expandedKeywords.length} additional keywords with AI`
      );

      // Combine site keywords + expanded keywords
      const allKeywords = [
        ...siteKeywords.map((kw) => kw.keyword),
        ...expandedKeywords,
      ];

      return {
        product,
        existingKeywords,
        allKeywords: allKeywords.slice(0, TARGET_KEYWORDS_COUNT * 2), // Get more to filter later
      };
    } catch (error) {
      console.error('Failed to expand keywords with AI:', error);
      // Fallback: just use what we have
      return {
        product,
        existingKeywords,
        allKeywords: siteKeywords.map((kw) => kw.keyword),
      };
    }
  },
});

// Step 4: Get bulk keyword difficulty from DataForSEO
const getBulkKeywordDifficultyStep = createStep({
  id: 'get-bulk-keyword-difficulty',
  inputSchema: z.object({
    product: ProductInputSchema,
    existingKeywords: z.array(z.string()),
    allKeywords: z.array(z.string()),
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
    const { product, allKeywords } = inputData;
    const api = getDataForSEOClient();

    console.log(
      `\n📡 Fetching keyword difficulty for ${allKeywords.length} keywords...`
    );

    try {
      const task =
        new DataForSEO.DataforseoLabsGoogleBulkKeywordDifficultyLiveRequestInfo();
      task.keywords = allKeywords;
      task.location_code = getLocationCode(product.country);
      task.language_code = product.language || 'en';

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
              (keywordInfo?.search_volume as number | undefined) || 100, // Default to 100 if not available
            difficulty:
              (keywordProps?.keyword_difficulty as number | undefined) || 50,
            cpc: (keywordInfo?.cpc as number | undefined) || 0,
            competition:
              (keywordInfo?.competition as number | undefined) || 0.5,
          };
        })
        .filter((kw) => kw.keyword && kw.keyword.length > 0) // Only filter out empty keywords
        .sort((a, b) => b.searchVolume - a.searchVolume) // Sort by search volume
        .slice(0, TARGET_KEYWORDS_COUNT); // Take exactly TARGET_KEYWORDS_COUNT

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
        keywordData: allKeywords.slice(0, TARGET_KEYWORDS_COUNT).map((kw) => ({
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

// Step 5: Analyze and finalize keywords
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

// ============================================
// WORKFLOW DEFINITION
// ============================================

export const keywordIdeasGeneratorWorkflow = createWorkflow({
  id: 'keyword-discovery',
  description: `
    Streamlined Keyword Discovery Workflow:
    
    1. Fetch existing keywords from database to avoid duplicates
    2. Get low competition keywords from customer's website (DataForSEO keywords_for_site)
    3. If needed, expand keyword universe with AI (Claude 3.5 Sonnet)
    4. Get bulk keyword difficulty and metrics (DataForSEO bulk_keyword_difficulty)
    5. Analyze with AI and return 30 unique, relevant keywords
    
    OUTPUT: 30 unique keywords with search volume, difficulty, business potential, and content recommendations
  `,
  inputSchema: ProductInputSchema,
  outputSchema: OutputSchema,
})
  .then(fetchExistingKeywordsStep)
  .then(getKeywordsForSiteStep)
  .then(expandKeywordsStep)
  .then(getBulkKeywordDifficultyStep)
  .then(analyzeAndFinalizeStep)
  .commit();

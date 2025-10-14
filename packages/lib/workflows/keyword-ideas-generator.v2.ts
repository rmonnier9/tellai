import { createWorkflow, createStep } from '@mastra/core/workflows';
import { Agent } from '@mastra/core/agent';
import { z } from 'zod';
import * as DataForSEO from 'dataforseo-client';
import prisma from '@workspace/db/prisma/client';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { KEYWORD_CONFIG } from './keyword-research-config';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if a keyword contains branded terms without relevant business context
 */
const isBrandedWithoutContext = (
  keyword: string,
  brandedTerms: string[],
  relevantContext: string[]
): boolean => {
  const keywordLower = keyword.toLowerCase();
  const hasBranded = brandedTerms.some((term) =>
    keywordLower.includes(term.toLowerCase())
  );
  const hasContext = relevantContext.some((term) =>
    keywordLower.includes(term.toLowerCase())
  );
  return hasBranded && !hasContext;
};

/**
 * Check if a keyword contains generic terms that should be filtered
 */
const isGenericTerm = (keyword: string, genericTerms: string[]): boolean => {
  const keywordLower = keyword.toLowerCase();
  return genericTerms.some((term) => keywordLower.includes(term.toLowerCase()));
};

/**
 * Check if a keyword represents a competitor gap opportunity
 */
const isCompetitorGap = (difficulty: number, searchVolume: number): boolean => {
  return (
    (difficulty < KEYWORD_CONFIG.GAP_DIFFICULTY_LOW &&
      searchVolume > KEYWORD_CONFIG.GAP_VOLUME_LOW) ||
    (difficulty < KEYWORD_CONFIG.GAP_DIFFICULTY_MEDIUM &&
      searchVolume > KEYWORD_CONFIG.GAP_VOLUME_MEDIUM)
  );
};

/**
 * Estimate traffic potential for ranking in top 3 positions
 */
const estimateTrafficPotential = (searchVolume: number): number => {
  return Math.round(searchVolume * KEYWORD_CONFIG.TOP_3_CTR);
};

// ============================================
// SCHEMA DEFINITIONS
// ============================================

// Search intent enum based on Ahrefs methodology
const SearchIntentEnum = z.enum([
  'informational', // Learn about something
  'navigational', // Find a specific page/brand
  'commercial', // Research before buying
  'transactional', // Ready to buy/take action
]);

// Business potential scoring (0-3) based on how well we can pitch the product
const BusinessPotentialEnum = z.enum(['0', '1', '2', '3']);

// Content type recommendation enums (matching Prisma schema)
const ArticleTypeEnum = z.enum(['guide', 'listicle']);

const GuideSubtypeEnum = z.enum([
  'how_to', // Step-by-step instructions
  'explainer', // What is, why, understanding concepts
  'comparison', // X vs Y, differences, alternatives
  'reference', // Definitions, glossaries, comprehensive resources
]);

const ListicleSubtypeEnum = z.enum([
  'round_up', // "Best X", "Top X", curated collections
  'resources', // Tools, templates, useful resources
  'examples', // Case studies, examples, inspiration
]);

// Keyword discovery schema - pure keyword research (no content generation)
const KeywordDiscoverySchema = z.object({
  keyword: z.string(),
  searchVolume: z.number(),
  keywordDifficulty: z.number(),
  cpc: z.number().optional(),
  competition: z.number().optional(),
  // Strategic SEO metrics
  searchIntent: SearchIntentEnum,
  businessPotential: BusinessPotentialEnum,
  trafficPotential: z.number(), // Estimated monthly traffic if ranked #1-3
  parentTopic: z.string().optional(), // Main topic to avoid cannibalization
  trendScore: z.number().optional(), // -1 to 1, indicating growth trend
  competitorGap: z.boolean(), // True if low competition vs volume
  priorityScore: z.number(), // 0-100 composite score for prioritization
  trafficDifficultyRatio: z.number(), // Search volume / difficulty
  rationale: z.string(), // Why this keyword is valuable
  // Content type recommendation (optimal format to rank #1)
  recommendedContentType: ArticleTypeEnum,
  recommendedSubtype: z.string(), // Guide or listicle subtype
  contentTypeRationale: z.string(), // Why this content type matches user intent & SERP
  scheduledDate: z.string(), // ISO date string for when to create content (1 per day for 30 days)
});

// Product schema for input
const ProductInputSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  country: z.string(),
  language: z.string(),
  targetAudiences: z.array(z.string()),
  url: z.string(),
});

// Keyword discovery output schema
const OutputSchema = z.object({
  productId: z.string(),
  keywords: z.array(KeywordDiscoverySchema),
  totalKeywords: z.number(),
  stats: z.object({
    avgSearchVolume: z.number(),
    avgDifficulty: z.number(),
    avgPriorityScore: z.number(),
    highBusinessPotential: z.number(), // Count of BP=3 keywords
    competitorGaps: z.number(), // Count of gap opportunities
    totalTrafficPotential: z.number(),
  }),
});

// Helper function to create authenticated fetch for DataForSEO
const createAuthenticatedFetch = (username: string, password: string) => {
  return (url: RequestInfo, init?: RequestInit): Promise<Response> => {
    const token = Buffer.from(`${username}:${password}`).toString('base64');
    const authHeader = { Authorization: `Basic ${token}` };

    const newInit: RequestInit = {
      ...init,
      headers: {
        ...init?.headers,
        ...authHeader,
      },
    };

    return fetch(url, newInit);
  };
};

// Initialize DataForSEO Labs API client (provides superior keyword data)
const getDataForSEOClient = () => {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new Error(
      'DataForSEO credentials not found in environment variables'
    );
  }

  const authFetch = createAuthenticatedFetch(login, password);
  return new DataForSEO.DataforseoLabsApi('https://api.dataforseo.com', {
    fetch: authFetch,
  });
};

// AI Agents with enhanced SEO expertise
const seoStrategist = new Agent({
  name: 'SEO Strategist',
  instructions: `You are an SEO strategist. Analyze keywords for search intent, business fit, and content recommendations. Always return complete analysis for every keyword provided.`,
  model: openrouter(KEYWORD_CONFIG.AI_MODEL),
});

const contextAnalyst = new Agent({
  name: 'Business Context Analyst',
  instructions: `You are a business context analyst specializing in competitive intelligence and market positioning. Analyze products to identify competitors, relevant business terms, and negative keywords to filter out.`,
  model: openrouter(KEYWORD_CONFIG.AI_MODEL),
});

// Step 1: Analyze business context to generate dynamic filtering criteria
const analyzeBusinessContextStep = createStep({
  id: 'analyze-business-context',
  inputSchema: ProductInputSchema,
  outputSchema: z.object({
    product: ProductInputSchema,
    filteringCriteria: z.object({
      brandedTerms: z
        .array(z.string())
        .describe(
          'Competitor/branded terms to filter (unless with relevant context)'
        ),
      relevantContext: z
        .array(z.string())
        .describe('Business-relevant terms indicating good keyword fit'),
      genericTerms: z
        .array(z.string())
        .describe('Generic/negative terms to always exclude'),
    }),
  }),
  execute: async ({ inputData }) => {
    const { name, description, targetAudiences, url } = inputData;

    console.log(`\n🔍 Analyzing business context for: ${name}`);

    const prompt = `Analyze this business to identify keyword filtering criteria for SEO research.

**BUSINESS:**
Name: ${name}
Description: ${description}
Target Audiences: ${targetAudiences.join(', ')}
Website: ${url}

**YOUR TASK:**
Generate three lists to help filter keyword research results:

1. **brandedTerms** (10-15 terms):
   - Direct competitors' brand names (lowercase)
   - Major industry leaders that dominate keywords
   - Generic brand terms that aren't specific to this business
   - Example: For a CRM tool → ["salesforce", "hubspot", "zoho", "pipedrive"]
   - Example: For a pizza restaurant → ["dominos", "pizza hut", "papa johns"]

2. **relevantContext** (8-12 terms):
   - Core business value propositions
   - Problem areas this business solves
   - Target customer indicators
   - Use case signals
   - Example: For email marketing → ["campaign", "newsletter", "subscribers", "automation"]
   - Example: For fitness app → ["workout", "training", "exercise", "fitness", "health"]

3. **genericTerms** (8-12 terms):
   - Negative terms unrelated to business goals
   - Troubleshooting/problem terms
   - Scandal/controversy keywords
   - Piracy/hack related terms
   - Terms that indicate poor user intent
   - Example: ["outage", "down", "not working", "scam", "fake", "hack", "leak"]

**RULES:**
- ALL terms must be lowercase
- Focus on terms SPECIFIC to this industry/niche
- brandedTerms: Include major competitors but not the business itself
- relevantContext: Terms that indicate commercial intent for THIS business
- genericTerms: Universal negative terms + industry-specific red flags
- Each list should have 8-15 terms total

Return your analysis.`;

    try {
      const result = await contextAnalyst.generateVNext(prompt, {
        output: z.object({
          brandedTerms: z
            .array(z.string())
            .min(8)
            .max(20)
            .describe('Competitor and major brand terms'),
          relevantContext: z
            .array(z.string())
            .min(8)
            .max(15)
            .describe('Business-relevant context terms'),
          genericTerms: z
            .array(z.string())
            .min(8)
            .max(15)
            .describe('Generic/negative terms to exclude'),
        }),
      });

      console.log(`✅ Generated filtering criteria:`);
      console.log(
        `   • ${result.object.brandedTerms.length} branded/competitor terms`
      );
      console.log(
        `   • ${result.object.relevantContext.length} relevant context terms`
      );
      console.log(
        `   • ${result.object.genericTerms.length} generic/negative terms`
      );

      return {
        product: inputData,
        filteringCriteria: {
          brandedTerms: result.object.brandedTerms,
          relevantContext: result.object.relevantContext,
          genericTerms: result.object.genericTerms,
        },
      };
    } catch (error) {
      console.error('Failed to analyze business context:', error);
      throw new Error(
        `Business context analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});

// Step 2: Generate seed keywords based on product
const generateSeedKeywordsStep = createStep({
  id: 'generate-seed-keywords',
  inputSchema: z.object({
    product: ProductInputSchema,
    filteringCriteria: z.object({
      brandedTerms: z.array(z.string()),
      relevantContext: z.array(z.string()),
      genericTerms: z.array(z.string()),
    }),
  }),
  outputSchema: z.object({
    product: ProductInputSchema,
    filteringCriteria: z.object({
      brandedTerms: z.array(z.string()),
      relevantContext: z.array(z.string()),
      genericTerms: z.array(z.string()),
    }),
    seedKeywords: z.array(z.string()),
  }),
  execute: async ({ inputData }) => {
    const { product, filteringCriteria } = inputData;
    const { name, description, targetAudiences, url } = product;

    const currentMonth = new Date().toLocaleString('default', {
      month: 'long',
    });
    const currentYear = new Date().getFullYear();

    const prompt = `As a world-class SEO strategist, generate EXACTLY ${KEYWORD_CONFIG.SEED_KEYWORDS_COUNT} strategically diverse seed keywords for comprehensive keyword research.

**PRODUCT CONTEXT:**
Name: ${name}
Description: ${description}
Target Audiences: ${targetAudiences.join(', ')}
Website: ${url}
Date: ${currentMonth} ${currentYear}

**CRITICAL: AVOID BRANDED & NEGATIVE TERMS**
❌ DO NOT include these competitor/branded terms: ${filteringCriteria.brandedTerms.join(', ')}
❌ DO NOT include these negative terms: ${filteringCriteria.genericTerms.join(', ')}
✅ DO include terms with this business context: ${filteringCriteria.relevantContext.join(', ')}

**STRATEGIC SEED KEYWORD FRAMEWORK:**

Generate keywords across these strategic categories (aim for 2-3 per category):

1. **Problem/Pain Points** - Core problems this product solves for target customers
2. **Solution Keywords** - Direct solution terms related to the product's value proposition
3. **Industry-Specific Use Cases** - Niche applications for the target audiences
4. **Comparison Keywords** - Alternative/vs keywords (but avoid the branded terms above)
5. **Educational Keywords** - "how to", "what is", "guide to" related to the product's domain
6. **Long-tail Solution Keywords** - Specific feature or benefit combinations
7. **Commercial Intent** - Pricing, cost, tool, software related keywords

**CRITICAL REQUIREMENTS:**
- Output EXACTLY ${KEYWORD_CONFIG.SEED_KEYWORDS_COUNT} keywords (DataForSEO API limit is ${KEYWORD_CONFIG.DATAFORSEO_SEED_LIMIT}, we need buffer)
- MUST be specific to this business and its value proposition
- NO competitor brand names from the branded terms list
- Focus on problems this product solves and benefits it provides
- Include target audience context: ${targetAudiences.join(', ')}

Output exactly ${KEYWORD_CONFIG.SEED_KEYWORDS_COUNT} diverse, business-focused seed keywords.`;

    try {
      const result = await seoStrategist.generateVNext(prompt, {
        output: z.object({
          keywords: z
            .array(z.string())
            .describe('Strategically diverse seed keywords for expansion'),
        }),
      });

      console.log(
        `Generated ${result.object.keywords.length} strategic seed keywords`
      );

      // CRITICAL: DataForSEO has a max limit per request
      // Ensure we never exceed this limit
      const limitedSeeds = result.object.keywords.slice(
        0,
        KEYWORD_CONFIG.DATAFORSEO_SEED_LIMIT
      );

      if (
        result.object.keywords.length > KEYWORD_CONFIG.DATAFORSEO_SEED_LIMIT
      ) {
        console.warn(
          `⚠️ AI generated ${result.object.keywords.length} seeds, limiting to ${KEYWORD_CONFIG.DATAFORSEO_SEED_LIMIT} for DataForSEO API`
        );
      }

      return {
        product,
        filteringCriteria,
        seedKeywords: limitedSeeds,
      };
    } catch (error) {
      throw new Error(
        `Failed to generate seed keywords: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});

// Step 2: Fetch existing articles to avoid duplicates
const fetchExistingArticlesStep = createStep({
  id: 'fetch-existing-articles',
  inputSchema: z.object({
    product: ProductInputSchema,
    filteringCriteria: z.object({
      brandedTerms: z.array(z.string()),
      relevantContext: z.array(z.string()),
      genericTerms: z.array(z.string()),
    }),
    seedKeywords: z.array(z.string()),
  }),
  outputSchema: z.object({
    product: ProductInputSchema,
    filteringCriteria: z.object({
      brandedTerms: z.array(z.string()),
      relevantContext: z.array(z.string()),
      genericTerms: z.array(z.string()),
    }),
    seedKeywords: z.array(z.string()),
    existingKeywords: z.array(z.string()),
  }),
  execute: async ({ inputData }) => {
    const { product, filteringCriteria, seedKeywords } = inputData;

    try {
      // Fetch all existing articles for this product
      const existingArticles = await prisma.article.findMany({
        where: {
          productId: product.id,
        },
        select: {
          keyword: true,
        },
      });

      const existingKeywords = existingArticles.map((article) =>
        article.keyword.toLowerCase()
      );

      console.log(
        `Found ${existingKeywords.length} existing articles for this product`
      );

      return {
        product,
        filteringCriteria,
        seedKeywords,
        existingKeywords,
      };
    } catch (error) {
      console.warn(
        'Failed to fetch existing articles, continuing without deduplication:',
        error
      );
      // Continue without deduplication if database query fails
      return {
        product,
        filteringCriteria,
        seedKeywords,
        existingKeywords: [],
      };
    }
  },
});

// Step 3: Get comprehensive keyword data from DataForSEO
const getKeywordDataStep = createStep({
  id: 'get-keyword-data',
  inputSchema: z.object({
    product: ProductInputSchema,
    filteringCriteria: z.object({
      brandedTerms: z.array(z.string()),
      relevantContext: z.array(z.string()),
      genericTerms: z.array(z.string()),
    }),
    seedKeywords: z.array(z.string()),
    existingKeywords: z.array(z.string()),
  }),
  outputSchema: z.object({
    product: ProductInputSchema,
    filteringCriteria: z.object({
      brandedTerms: z.array(z.string()),
      relevantContext: z.array(z.string()),
      genericTerms: z.array(z.string()),
    }),
    keywordData: z.array(
      z.object({
        keyword: z.string(),
        searchVolume: z.number(),
        difficulty: z.number(),
        cpc: z.number().optional(),
        competition: z.number().optional(),
        relatedKeywords: z.array(z.string()).optional(),
        monthlySearches: z
          .array(
            z.object({
              month: z.string(),
              volume: z.number(),
            })
          )
          .optional(),
        trend: z.number().optional(), // Growth trend
      })
    ),
  }),
  execute: async ({ inputData }) => {
    const { product, filteringCriteria, seedKeywords, existingKeywords } =
      inputData;
    const api = getDataForSEOClient();

    console.log(
      `Starting comprehensive keyword research with ${seedKeywords.length} seed keywords`
    );
    console.log(
      `Excluding ${existingKeywords.length} already-used keywords from search`
    );
    console.log(
      `Using DataForSEO Labs API for superior keyword difficulty scores and normalized search volumes`
    );

    // CRITICAL VALIDATION: DataForSEO limit per request
    if (seedKeywords.length > KEYWORD_CONFIG.DATAFORSEO_SEED_LIMIT) {
      throw new Error(
        `DataForSEO API limit exceeded: ${seedKeywords.length} seeds provided, max is ${KEYWORD_CONFIG.DATAFORSEO_SEED_LIMIT}. This should never happen - check seed generation step.`
      );
    }

    try {
      // STEP 1: Get keyword ideas and comprehensive data from DataForSEO Labs API
      // This endpoint provides superior data including keyword difficulty, normalized volumes, and better metrics
      const task =
        new DataForSEO.DataforseoLabsGoogleKeywordIdeasLiveRequestInfo();
      task.language_code = product.language || 'en';
      task.location_code = getLocationCode(product.country);
      task.keywords = seedKeywords;
      task.include_seed_keyword = true;
      task.include_serp_info = true;
      task.include_clickstream_data = true; // Get normalized search volumes with real user data
      task.limit = KEYWORD_CONFIG.DATAFORSEO_RESULTS_LIMIT; // Get comprehensive keyword ideas
      task.filters = [
        ['keyword_info.search_volume', '>', 0], // Only keywords with search volume
      ];
      task.order_by = ['keyword_info.search_volume,desc']; // Sort by search volume

      const response = await api.googleKeywordIdeasLive([task]);

      if (!response || !response.tasks || response.tasks.length === 0) {
        throw new Error('No data returned from DataForSEO');
      }

      const taskResult = response.tasks[0];
      if (!taskResult) {
        throw new Error('No task result returned from DataForSEO');
      }

      if (taskResult.status_code !== 20000) {
        throw new Error(
          `DataForSEO error: ${taskResult.status_message || 'Unknown error'}`
        );
      }

      const keywordData: Array<{
        keyword: string;
        searchVolume: number;
        difficulty: number;
        cpc?: number;
        competition?: number;
        relatedKeywords?: string[];
        monthlySearches?: Array<{ month: string; volume: number }>;
        trend?: number;
      }> = [];

      // CRITICAL: DataForSEO Labs API returns data in result[0].items, not result directly
      const resultData = taskResult.result?.[0];
      const keywordItems = resultData?.items || [];

      console.log(
        `DataForSEO Labs API returned ${keywordItems.length} keyword ideas (total_count: ${resultData?.total_count || 0})`
      );

      // DEBUG: Log the structure of the first result items to understand API response
      if (keywordItems.length > 0) {
        const firstItem = keywordItems[0];
        const secondItem = keywordItems[1];
        console.log(
          '\n🔍 DEBUG - API Response Structure (FIXED):',
          JSON.stringify(
            {
              totalResults: keywordItems.length,
              totalCount: resultData?.total_count,
              firstItem: {
                keyword: firstItem?.keyword || 'N/A',
                hasKeywordInfo: !!firstItem?.keyword_info,
                keywordInfoKeys: firstItem?.keyword_info
                  ? Object.keys(firstItem.keyword_info)
                  : [],
                searchVolume: firstItem?.keyword_info?.search_volume,
                hasNormalized:
                  !!firstItem?.keyword_info_normalized_with_clickstream,
                normalizedSearchVolume:
                  firstItem?.keyword_info_normalized_with_clickstream
                    ?.search_volume,
                keywordDifficulty: firstItem?.keyword_difficulty,
                keywordProperties: firstItem?.keyword_properties
                  ? Object.keys(firstItem.keyword_properties)
                  : null,
                keywordPropertiesKD:
                  firstItem?.keyword_properties?.keyword_difficulty,
                cpc: firstItem?.cpc,
                competition: firstItem?.competition,
                allKeys: firstItem ? Object.keys(firstItem) : [],
              },
              secondItem: secondItem
                ? {
                    keyword: secondItem.keyword || 'N/A',
                    searchVolume: secondItem?.keyword_info?.search_volume,
                  }
                : null,
            },
            null,
            2
          )
        );
      }

      // STEP 2: Calculate trend scores from monthly search volumes
      const calculateTrend = (
        monthlySearches?: Array<{
          year?: number;
          month?: number;
          search_volume?: number;
        }>
      ): number => {
        if (!monthlySearches || monthlySearches.length < 6) return 0;

        // Compare last 3 months vs previous 3 months
        const recent = monthlySearches.slice(0, 3);
        const previous = monthlySearches.slice(3, 6);

        const recentAvg =
          recent.reduce((sum, m) => sum + (m.search_volume || 0), 0) /
          recent.length;
        const previousAvg =
          previous.reduce((sum, m) => sum + (m.search_volume || 0), 0) /
          previous.length;

        if (previousAvg === 0) return 0;

        // Return trend between -1 (declining) and 1 (growing)
        const change = (recentAvg - previousAvg) / previousAvg;
        return Math.max(-1, Math.min(1, change));
      };

      // STEP 3: Extract keywords with superior DataForSEO Labs data
      // This API provides keyword_difficulty (0-100), normalized search volumes, and better metrics
      let skippedCounts = {
        noKeyword: 0,
        noKeywordInfo: 0,
        noSearchVolume: 0,
        alreadyExists: 0,
        duplicate: 0,
        lowVolume: 0,
        added: 0,
      };
      let difficultyStats = {
        real: 0, // Keywords with actual difficulty data from DataForSEO
        estimated: 0, // Keywords using competition-based estimates
      };

      if (keywordItems.length > 0) {
        for (const item of keywordItems) {
          // CRITICAL: Validate item exists first
          if (!item || !item.keyword) {
            skippedCounts.noKeyword++;
            continue; // Skip invalid items
          }

          // FILTER: Remove generic/branded keywords that don't match business context
          if (
            isBrandedWithoutContext(
              item.keyword,
              filteringCriteria.brandedTerms,
              filteringCriteria.relevantContext
            )
          ) {
            skippedCounts.noKeyword++; // Reuse counter for filtered keywords
            continue;
          }

          // Skip generic troubleshooting terms
          if (isGenericTerm(item.keyword, filteringCriteria.genericTerms)) {
            skippedCounts.noKeyword++;
            continue;
          }

          // Extract keyword_info object (DataForSEO Labs API structure)
          const keywordInfo = item.keyword_info;
          const keywordInfoNormalized =
            item.keyword_info_normalized_with_clickstream || keywordInfo;

          // CRITICAL: Only use keywords with REAL search volume and difficulty data
          if (
            !keywordInfo ||
            keywordInfo.search_volume === null ||
            keywordInfo.search_volume === undefined
          ) {
            skippedCounts.noKeywordInfo++;
            // Log first few skips for debugging
            if (skippedCounts.noKeywordInfo <= 3) {
              console.log(
                `⚠️ SKIP (no keyword_info): "${item.keyword}" - hasKeywordInfo: ${!!keywordInfo}, searchVolume: ${keywordInfo?.search_volume}`
              );
            }
            continue; // Skip items without real data
          }

          // Skip if already used in previous runs
          if (
            existingKeywords.some(
              (existingKw) => existingKw === item.keyword?.toLowerCase()
            )
          ) {
            skippedCounts.alreadyExists++;
            continue;
          }

          // Skip if already added in this batch
          if (keywordData.some((kw) => kw.keyword === item.keyword)) {
            skippedCounts.duplicate++;
            continue;
          }

          // Filter for minimum quality threshold
          // API can return string or number, ensure we have a number
          const searchVolume = Number(
            keywordInfoNormalized?.search_volume ||
              keywordInfo.search_volume ||
              0
          );
          if (searchVolume < KEYWORD_CONFIG.MIN_SEARCH_VOLUME) {
            skippedCounts.lowVolume++;
            continue;
          }

          // Get keyword difficulty (0-100 score from DataForSEO Labs)
          // Check multiple possible locations in the API response
          let keywordDifficulty =
            item.keyword_difficulty ??
            item.keyword_properties?.keyword_difficulty ??
            null;

          let hasRealDifficulty = false;

          // If still no keyword difficulty, try to derive from competition and search volume
          if (keywordDifficulty === null || keywordDifficulty === undefined) {
            // Log missing data for debugging (only for first keyword to avoid spam)
            if (difficultyStats.estimated === 0) {
              console.warn(
                `⚠️ No keyword_difficulty data from DataForSEO. Using competition-based estimates.`
              );
              console.warn(
                `   Note: Google Keyword Ideas endpoint may not include keyword_difficulty for all keywords.`
              );
            }

            // Estimate difficulty from competition (0-1 scale) if available
            const competition = Number(item.competition || 0.5);
            keywordDifficulty = Math.round(competition * 100); // Convert to 0-100 scale
            difficultyStats.estimated++;
          } else {
            hasRealDifficulty = true;
            difficultyStats.real++;
          }

          keywordDifficulty = Number(keywordDifficulty);

          // Calculate traffic/difficulty ratio for ranking potential
          const trafficDifficultyRatio =
            searchVolume / Math.max(keywordDifficulty, 1);

          // Get CPC and competition data - ensure numbers
          const cpc = Number(item.cpc || 0);
          const competition =
            item.competition !== undefined ? Number(item.competition) : 0.5;

          // Calculate trend from monthly searches (use normalized data if available)
          const monthlySearchData =
            keywordInfoNormalized?.monthly_searches ||
            keywordInfo.monthly_searches;
          const trend = calculateTrend(
            monthlySearchData as
              | Array<{
                  year?: number;
                  month?: number;
                  search_volume?: number;
                }>
              | undefined
          );

          // Format monthly searches
          const monthlySearches = monthlySearchData
            ?.slice(0, 12)
            .filter((m: any) => m !== null && m !== undefined)
            .map((m: any) => ({
              month: `${m.year || 0}-${String(m.month || 0).padStart(2, '0')}`,
              volume: Number(m.search_volume || 0),
            }));

          keywordData.push({
            keyword: item.keyword,
            searchVolume: searchVolume, // Prefer normalized data from clickstream
            difficulty: keywordDifficulty, // DataForSEO Labs keyword difficulty (superior metric)
            cpc: cpc,
            competition: competition,
            monthlySearches,
            trend,
          });

          skippedCounts.added++;

          // Log first few successful additions for debugging
          if (skippedCounts.added <= 5) {
            console.log(
              `✅ Added keyword #${skippedCounts.added}: "${item.keyword}" (volume: ${searchVolume}, difficulty: ${keywordDifficulty})`
            );
          }
        }
      }

      console.log(`
📊 KEYWORD EXTRACTION SUMMARY:
- Total results from API: ${keywordItems.length} (from ${resultData?.total_count || 0} total available)
- Keywords added: ${skippedCounts.added}
- Skipped (no keyword): ${skippedCounts.noKeyword}
- Skipped (no keyword_info): ${skippedCounts.noKeywordInfo}
- Skipped (already exists): ${skippedCounts.alreadyExists}
- Skipped (duplicate in batch): ${skippedCounts.duplicate}
- Skipped (low volume <${KEYWORD_CONFIG.MIN_SEARCH_VOLUME}): ${skippedCounts.lowVolume}

🎯 KEYWORD DIFFICULTY DATA:
- Real difficulty scores from DataForSEO: ${difficultyStats.real} (${Math.round((difficultyStats.real / (difficultyStats.real + difficultyStats.estimated)) * 100) || 0}%)
- Competition-based estimates: ${difficultyStats.estimated} (${Math.round((difficultyStats.estimated / (difficultyStats.real + difficultyStats.estimated)) * 100) || 0}%)
${difficultyStats.estimated > 0 ? '⚠️  Note: Some keywords lack SERP data in DataForSEO database - using competition (0-1) scaled to difficulty (0-100)' : ''}
      `);

      console.log(
        `Extracted ${keywordData.length} keywords with DataForSEO Labs metrics`
      );

      // STEP 4: Sort by traffic/difficulty ratio (best opportunities first)
      // This ensures we prioritize keywords with good search volume vs ranking difficulty
      keywordData.sort((a, b) => {
        const ratioA = a.searchVolume / Math.max(a.difficulty, 1);
        const ratioB = b.searchVolume / Math.max(b.difficulty, 1);

        // Apply trend boost (20% weight)
        const scoreA = ratioA * (1 + (a.trend || 0) * 0.2);
        const scoreB = ratioB * (1 + (b.trend || 0) * 0.2);

        return scoreB - scoreA;
      });

      console.log(
        `Sorted ${keywordData.length} keywords by traffic/difficulty ratio`
      );

      // Take top 100 for analysis (no arbitrary limits)
      const topKeywords = keywordData.slice(0, 100);

      console.log(`Selected top ${topKeywords.length} keywords for analysis`);

      return {
        product,
        filteringCriteria,
        keywordData: topKeywords,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch keyword data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});

// Temporary schema without scheduledDate (will be added in finalize step)
const KeywordWithoutScheduleSchema = z.object({
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
  // Content type recommendation
  recommendedContentType: ArticleTypeEnum,
  recommendedSubtype: z.string(), // Guide or listicle subtype
  contentTypeRationale: z.string(),
});

// Step 4: Analyze keywords for SEO potential (simplified - no content generation)
const analyzeKeywordsStep = createStep({
  id: 'analyze-keywords',
  inputSchema: z.object({
    product: ProductInputSchema,
    filteringCriteria: z.object({
      brandedTerms: z.array(z.string()),
      relevantContext: z.array(z.string()),
      genericTerms: z.array(z.string()),
    }),
    keywordData: z.array(
      z.object({
        keyword: z.string(),
        searchVolume: z.number(),
        difficulty: z.number(),
        cpc: z.number().optional(),
        competition: z.number().optional(),
        relatedKeywords: z.array(z.string()).optional(),
        monthlySearches: z
          .array(
            z.object({
              month: z.string(),
              volume: z.number(),
            })
          )
          .optional(),
        trend: z.number().optional(),
      })
    ),
  }),
  outputSchema: z.object({
    product: ProductInputSchema,
    filteringCriteria: z.object({
      brandedTerms: z.array(z.string()),
      relevantContext: z.array(z.string()),
      genericTerms: z.array(z.string()),
    }),
    analyzedKeywords: z.array(KeywordWithoutScheduleSchema),
  }),
  execute: async ({ inputData }) => {
    const { product, filteringCriteria, keywordData } = inputData;

    const prompt = `Analyze keywords for: ${product.name} - ${product.description}

Target: ${product.targetAudiences.join(', ')}

Keywords (${keywordData.length}):
${keywordData
  .map(
    (kw, i) =>
      `${i + 1}. "${kw.keyword}" | Vol: ${kw.searchVolume} | Diff: ${kw.difficulty} | CPC: $${(kw.cpc || 0).toFixed(2)}`
  )
  .join('\n')}

For each keyword analyze:

1. searchIntent: informational, navigational, commercial, or transactional
2. businessPotential: "3" (perfect fit), "2" (good fit), "1" (weak fit), "0" (no fit)
3. trafficPotential: Estimated monthly traffic if ranked #1-3 (use ~${Math.round(KEYWORD_CONFIG.TOP_3_CTR * 100)}% of search volume)
4. parentTopic: Broader topic category (optional, can be empty)
5. competitorGap: true if KD<${KEYWORD_CONFIG.GAP_DIFFICULTY_LOW} AND volume>${KEYWORD_CONFIG.GAP_VOLUME_LOW}, OR KD<${KEYWORD_CONFIG.GAP_DIFFICULTY_MEDIUM} AND volume>${KEYWORD_CONFIG.GAP_VOLUME_MEDIUM}; false otherwise
6. rationale: One sentence why this keyword is valuable
7. recommendedContentType: "guide" or "listicle"
8. recommendedSubtype: 
   - If guide: "how_to", "explainer", "comparison", or "reference"
   - If listicle: "round_up", "resources", or "examples"
9. contentTypeRationale: One sentence why this format will rank

Rules:
- businessPotential: Focus on customer support/automation fit. Generic AI terms = 0 or 1. Support-specific = 2 or 3.
- Content type: "how to X" → guide/how_to, "best X" → listicle/round_up, "what is X" → guide/explainer
- MUST analyze ALL ${keywordData.length} keywords

Return analysis for every single keyword.`;

    try {
      const result = await seoStrategist.generateVNext(prompt, {
        output: z.object({
          analyses: z.array(
            z.object({
              keyword: z.string(),
              searchIntent: SearchIntentEnum,
              businessPotential: BusinessPotentialEnum,
              trafficPotential: z.number(),
              parentTopic: z.string().optional(),
              competitorGap: z.boolean(),
              rationale: z.string(),
              recommendedContentType: ArticleTypeEnum,
              // Accept subtype as string to avoid union validation issues
              recommendedSubtype: z.string(),
              contentTypeRationale: z.string(),
            })
          ),
        }),
      });

      const analyzedKeywords = keywordData.map((kw) => {
        const analysis = result.object.analyses.find(
          (a) => a.keyword === kw.keyword
        );

        // Calculate traffic/difficulty ratio
        const trafficDifficultyRatio =
          kw.searchVolume / Math.max(kw.difficulty, 1);

        // Calculate priority score (0-100)
        const calculatePriorityScore = (
          data: typeof kw,
          analyzed?: (typeof result.object.analyses)[0]
        ): number => {
          const weights = KEYWORD_CONFIG.PRIORITY_WEIGHTS;

          // Base: Traffic/difficulty ratio
          const ratioScore = Math.min(
            (trafficDifficultyRatio / 100) * weights.TRAFFIC_DIFFICULTY_RATIO,
            weights.TRAFFIC_DIFFICULTY_RATIO
          );

          // Volume score
          const volumeScore = Math.min(
            (data.searchVolume / 1000) * weights.SEARCH_VOLUME,
            weights.SEARCH_VOLUME
          );

          // CPC score - commercial value
          const cpcScore = Math.min(
            ((data.cpc || 0) / 5) * weights.CPC,
            weights.CPC
          );

          // Trend bonus
          const trendBonus = (data.trend || 0) > 0 ? weights.TREND_BONUS : 0;

          // Business potential multiplier (most important!)
          const bpMultipliers = weights.BUSINESS_POTENTIAL_MULTIPLIERS;
          const bpMultiplier =
            analyzed?.businessPotential === '3'
              ? bpMultipliers.BP_3
              : analyzed?.businessPotential === '2'
                ? bpMultipliers.BP_2
                : analyzed?.businessPotential === '1'
                  ? bpMultipliers.BP_1
                  : bpMultipliers.BP_0;

          // Competitor gap bonus
          const gapBonus = analyzed?.competitorGap ? weights.GAP_BONUS : 0;

          const baseScore =
            ratioScore + volumeScore + cpcScore + trendBonus + gapBonus;
          return Math.min(Math.round(baseScore * bpMultiplier), 100);
        };

        if (!analysis) {
          // Fallback if AI didn't analyze this keyword - use heuristics
          const priorityScore = calculatePriorityScore(kw);

          // Simple content type heuristics
          let contentType: 'guide' | 'listicle' = 'guide';
          let subtype: string = 'explainer';

          const kwLower = kw.keyword.toLowerCase();
          if (kwLower.includes('best') || kwLower.includes('top ')) {
            contentType = 'listicle';
            subtype = 'round_up';
          } else if (kwLower.startsWith('how to ')) {
            contentType = 'guide';
            subtype = 'how_to';
          } else if (
            kwLower.includes(' vs ') ||
            kwLower.includes('alternative')
          ) {
            contentType = 'guide';
            subtype = 'comparison';
          } else if (
            kwLower.includes('examples') ||
            kwLower.includes('ideas')
          ) {
            contentType = 'listicle';
            subtype = 'examples';
          }

          return {
            keyword: kw.keyword,
            searchVolume: kw.searchVolume,
            keywordDifficulty: kw.difficulty,
            cpc: kw.cpc,
            competition: kw.competition,
            searchIntent: 'informational' as const,
            businessPotential: '1' as const,
            trafficPotential: estimateTrafficPotential(kw.searchVolume),
            parentTopic: undefined,
            trendScore: kw.trend,
            competitorGap: isCompetitorGap(kw.difficulty, kw.searchVolume),
            priorityScore,
            trafficDifficultyRatio,
            rationale:
              'Keyword requires manual review - AI analysis unavailable',
            recommendedContentType: contentType,
            recommendedSubtype: subtype as any,
            contentTypeRationale: 'Determined by keyword pattern heuristics',
          };
        }

        // Use AI analysis
        const priorityScore = calculatePriorityScore(kw, analysis);

        return {
          keyword: kw.keyword,
          searchVolume: kw.searchVolume,
          keywordDifficulty: kw.difficulty,
          cpc: kw.cpc,
          competition: kw.competition,
          searchIntent: analysis.searchIntent,
          businessPotential: analysis.businessPotential,
          trafficPotential: analysis.trafficPotential,
          parentTopic: analysis.parentTopic,
          trendScore: kw.trend,
          competitorGap: analysis.competitorGap,
          priorityScore,
          trafficDifficultyRatio,
          rationale: analysis.rationale,
          recommendedContentType: analysis.recommendedContentType,
          recommendedSubtype: analysis.recommendedSubtype,
          contentTypeRationale: analysis.contentTypeRationale,
        };
      });

      console.log(`Completed analysis of ${analyzedKeywords.length} keywords`);

      return {
        product,
        filteringCriteria,
        analyzedKeywords,
      };
    } catch (error) {
      throw new Error(
        `Failed to analyze and categorize keywords: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});

// Step 5: Finalize and return discovered keywords with stats
const finalizeKeywordsStep = createStep({
  id: 'finalize-keywords',
  inputSchema: z.object({
    product: ProductInputSchema,
    analyzedKeywords: z.array(KeywordWithoutScheduleSchema),
  }),
  outputSchema: OutputSchema,
  execute: async ({ inputData }) => {
    const { product, analyzedKeywords } = inputData;

    console.log(`Finalizing ${analyzedKeywords.length} discovered keywords`);

    // FILTER: Remove keywords with low business potential
    const businessRelevantKeywords = analyzedKeywords.filter((kw) => {
      const bp = parseInt(kw.businessPotential);
      return bp >= KEYWORD_CONFIG.MIN_BUSINESS_POTENTIAL;
    });

    console.log(
      `Filtered for business relevance: ${analyzedKeywords.length} → ${businessRelevantKeywords.length} keywords (BP≥${KEYWORD_CONFIG.MIN_BUSINESS_POTENTIAL})`
    );

    // Sort by priority score (high to low)
    const sortedKeywords = [...businessRelevantKeywords].sort(
      (a, b) => b.priorityScore - a.priorityScore
    );

    // CRITICAL: Ensure UNIQUE keywords only (NO duplicates)
    // Remove any potential duplicates (case-insensitive)
    const uniqueKeywordsMap = new Map<string, (typeof sortedKeywords)[0]>();
    for (const kw of sortedKeywords) {
      const normalizedKeyword = kw.keyword.toLowerCase().trim();
      // Keep first occurrence (highest priority)
      if (!uniqueKeywordsMap.has(normalizedKeyword)) {
        uniqueKeywordsMap.set(normalizedKeyword, kw);
      }
    }

    const uniqueKeywords = Array.from(uniqueKeywordsMap.values());

    console.log(
      `Deduplicated: ${sortedKeywords.length} → ${uniqueKeywords.length} unique keywords`
    );

    // Select target number of unique keywords (may be less if not enough available)
    const finalKeywords = uniqueKeywords.slice(
      0,
      KEYWORD_CONFIG.FINAL_KEYWORDS_COUNT
    );

    if (finalKeywords.length < KEYWORD_CONFIG.FINAL_KEYWORDS_COUNT) {
      console.warn(
        `⚠️ Only ${finalKeywords.length} unique keywords available (expected ${KEYWORD_CONFIG.FINAL_KEYWORDS_COUNT}). Consider broadening seed keywords or adjusting filters.`
      );
    } else {
      console.log(
        `✅ Selected ${KEYWORD_CONFIG.FINAL_KEYWORDS_COUNT} unique keywords from ${sortedKeywords.length} candidates`
      );
    }

    // Add scheduledDate to each keyword (1 per day, starting today)
    const keywordsWithSchedule = finalKeywords.map((kw, index) => {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + index);

      return {
        ...kw,
        scheduledDate: scheduledDate.toISOString(),
      };
    });

    // Calculate statistics
    const stats = {
      avgSearchVolume: Math.round(
        keywordsWithSchedule.reduce((sum, kw) => sum + kw.searchVolume, 0) /
          keywordsWithSchedule.length
      ),
      avgDifficulty: Math.round(
        keywordsWithSchedule.reduce(
          (sum, kw) => sum + kw.keywordDifficulty,
          0
        ) / keywordsWithSchedule.length
      ),
      avgPriorityScore: Math.round(
        keywordsWithSchedule.reduce((sum, kw) => sum + kw.priorityScore, 0) /
          keywordsWithSchedule.length
      ),
      highBusinessPotential: keywordsWithSchedule.filter(
        (kw) => kw.businessPotential === '3'
      ).length,
      competitorGaps: keywordsWithSchedule.filter((kw) => kw.competitorGap)
        .length,
      totalTrafficPotential: keywordsWithSchedule.reduce(
        (sum, kw) => sum + kw.trafficPotential,
        0
      ),
    };

    const lastKeyword = keywordsWithSchedule[keywordsWithSchedule.length - 1];

    // Calculate content type distribution
    const contentTypeStats = {
      guides: keywordsWithSchedule.filter(
        (kw) => kw.recommendedContentType === 'guide'
      ).length,
      listicles: keywordsWithSchedule.filter(
        (kw) => kw.recommendedContentType === 'listicle'
      ).length,
      howTo: keywordsWithSchedule.filter(
        (kw) => kw.recommendedSubtype === 'how_to'
      ).length,
      explainer: keywordsWithSchedule.filter(
        (kw) => kw.recommendedSubtype === 'explainer'
      ).length,
      comparison: keywordsWithSchedule.filter(
        (kw) => kw.recommendedSubtype === 'comparison'
      ).length,
      reference: keywordsWithSchedule.filter(
        (kw) => kw.recommendedSubtype === 'reference'
      ).length,
      roundUp: keywordsWithSchedule.filter(
        (kw) => kw.recommendedSubtype === 'round_up'
      ).length,
      resources: keywordsWithSchedule.filter(
        (kw) => kw.recommendedSubtype === 'resources'
      ).length,
      examples: keywordsWithSchedule.filter(
        (kw) => kw.recommendedSubtype === 'examples'
      ).length,
    };

    const bp3Count = keywordsWithSchedule.filter(
      (kw) => kw.businessPotential === '3'
    ).length;
    const bp2Count = keywordsWithSchedule.filter(
      (kw) => kw.businessPotential === '2'
    ).length;

    console.log(`
📊 KEYWORD DISCOVERY SUMMARY:
- Total Keywords: ${keywordsWithSchedule.length} ${keywordsWithSchedule.length === 30 ? '✅' : `⚠️ (target: 30)`}
- All keywords are UNIQUE (no duplicates)
- ✅ Business Relevance: ALL keywords have BP≥2 (good product fit)
- Avg Search Volume: ${stats.avgSearchVolume.toLocaleString()}/mo
- Avg Difficulty: ${stats.avgDifficulty}/100
- Avg Priority Score: ${stats.avgPriorityScore}/100
- Business Potential: BP=3 (Perfect fit): ${bp3Count} | BP=2 (Good fit): ${bp2Count}
- Competitor Gap Opportunities: ${stats.competitorGaps} keywords
- Total Traffic Potential: ${stats.totalTrafficPotential.toLocaleString()}/month
- Avg Traffic/Difficulty Ratio: ${(keywordsWithSchedule.reduce((sum, kw) => sum + kw.trafficDifficultyRatio, 0) / keywordsWithSchedule.length).toFixed(1)}
- Schedule: ${keywordsWithSchedule[0]?.scheduledDate.split('T')[0] || 'N/A'} to ${lastKeyword?.scheduledDate.split('T')[0] || 'N/A'}

📝 CONTENT TYPE DISTRIBUTION:
- Guides: ${contentTypeStats.guides} (How-to: ${contentTypeStats.howTo}, Explainer: ${contentTypeStats.explainer}, Comparison: ${contentTypeStats.comparison}, Reference: ${contentTypeStats.reference})
- Listicles: ${contentTypeStats.listicles} (Round-up: ${contentTypeStats.roundUp}, Resources: ${contentTypeStats.resources}, Examples: ${contentTypeStats.examples})

Top 10 Keywords by Priority:
${keywordsWithSchedule
  .slice(0, 10)
  .map(
    (kw, i) =>
      `${i + 1}. ${kw.keyword}
   Priority: ${kw.priorityScore} | Volume: ${kw.searchVolume} | Difficulty: ${kw.keywordDifficulty} | BP: ${kw.businessPotential}
   Content: ${kw.recommendedContentType} (${kw.recommendedSubtype}) | ${kw.scheduledDate.split('T')[0]}`
  )
  .join('\n')}
    `);

    return {
      productId: product.id,
      keywords: keywordsWithSchedule,
      totalKeywords: keywordsWithSchedule.length,
      stats,
    };
  },
});

// Helper function to get location code from country code
function getLocationCode(countryCode: string): number {
  // Map common country codes to DataForSEO location codes
  const locationMap: Record<string, number> = {
    US: 2840, // United States
    GB: 2826, // United Kingdom
    CA: 2124, // Canada
    AU: 2036, // Australia
    DE: 2276, // Germany
    FR: 2250, // France
    ES: 2724, // Spain
    IT: 2380, // Italy
    NL: 2528, // Netherlands
    SE: 2752, // Sweden
    NO: 2578, // Norway
    DK: 2208, // Denmark
    FI: 2246, // Finland
    PL: 2616, // Poland
    BR: 2076, // Brazil
    MX: 2484, // Mexico
    IN: 2356, // India
    SG: 2702, // Singapore
    HK: 2344, // Hong Kong
    JP: 2392, // Japan
  };

  return locationMap[countryCode.toUpperCase()] || 2840; // Default to US
}

// Keyword discovery workflow - focused on finding high-potential keywords
export const keywordIdeasGeneratorWorkflow = createWorkflow({
  id: 'keyword-discovery',
  description: `
    Keyword discovery workflow using DataForSEO Labs API and AI-powered content strategy:
    
    FOCUS: Find high-potential keywords with optimal content type recommendations to rank #1
    
    ENHANCEMENTS (DataForSEO Labs API):
    - Superior keyword difficulty scores (0-100) vs basic competition index
    - Normalized search volumes with clickstream data for accuracy
    - Up to 1000 keyword ideas per request (vs 100 in Google Ads API)
    - Better monthly search trend data
    - More comprehensive SERP metrics
    
    CONTENT TYPE INTELLIGENCE:
    - AI-powered content format recommendations (guide vs listicle)
    - Specific subtype selection (how_to, explainer, comparison, reference, round_up, resources, examples)
    - Intent-based format matching for better rankings
    - SERP analysis for content type optimization
    
    Steps:
    1. Analyze business context to generate dynamic filtering criteria (competitors, relevant terms, negative keywords)
    2. Generate strategic seed keywords across 7 categories (avoiding filtered terms)
    3. Fetch existing keywords to avoid duplicates  
    4. Expand via DataForSEO Labs API with premium keyword data (filtered dynamically)
    5. AI analysis: search intent, business potential, traffic estimation, and content type recommendation
    6. Sort by priority score and return exactly 30 unique keywords with comprehensive stats and content strategy
    
    Output: 30 unique keywords with metrics + optimal content type for each (NO duplicates)
  `,
  inputSchema: ProductInputSchema,
  outputSchema: OutputSchema,
})
  .then(analyzeBusinessContextStep)
  .then(generateSeedKeywordsStep)
  .then(fetchExistingArticlesStep)
  .then(getKeywordDataStep)
  .then(analyzeKeywordsStep)
  .commit();

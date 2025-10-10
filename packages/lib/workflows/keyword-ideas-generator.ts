import { createWorkflow, createStep } from '@mastra/core/workflows';
import { Agent } from '@mastra/core/agent';
import { z } from 'zod';
import * as DataForSEO from 'dataforseo-client';
import prisma from '@workspace/db/prisma/client';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Search intent enum based on Ahrefs methodology
const SearchIntentEnum = z.enum([
  'informational', // Learn about something
  'navigational', // Find a specific page/brand
  'commercial', // Research before buying
  'transactional', // Ready to buy/take action
]);

// Business potential scoring (0-3) based on how well we can pitch the product
const BusinessPotentialEnum = z.enum(['0', '1', '2', '3']);

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

// Initialize DataForSEO client
const getDataForSEOClient = () => {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new Error(
      'DataForSEO credentials not found in environment variables'
    );
  }

  const authFetch = createAuthenticatedFetch(login, password);
  return new DataForSEO.KeywordsDataApi('https://api.dataforseo.com', {
    fetch: authFetch,
  });
};

// AI Agents with enhanced SEO expertise
const seoStrategist = new Agent({
  name: 'SEO Strategist',
  instructions: `You are a world-class SEO strategist with deep expertise in:

**Keyword Research Principles:**
- Understanding search intent (informational, navigational, commercial, transactional)
- Identifying parent topics to avoid keyword cannibalization
- Balancing search volume with ranking difficulty
- Prioritizing keywords with high business potential
- Analyzing SERP features and content formats that rank

**Business-Focused SEO:**
- Assess "business potential" (0-3 scale):
  * 3 = Can naturally pitch product in content
  * 2 = Can mention product as solution
  * 1 = Can mention product subtly
  * 0 = Impossible to pitch product

**Content Strategy:**
- Identify keyword clusters and parent topics
- Match content format to search intent
- Spot competitor content gaps
- Recognize trending topics with growth potential

Your analyses should be data-driven, strategic, and focused on ROI.`,
  model: openrouter('openai/o3'),
});

// Step 1: Generate seed keywords based on product
const generateSeedKeywordsStep = createStep({
  id: 'generate-seed-keywords',
  inputSchema: ProductInputSchema,
  outputSchema: z.object({
    product: ProductInputSchema,
    seedKeywords: z.array(z.string()),
  }),
  execute: async ({ inputData }) => {
    const { name, description, targetAudiences, url } = inputData;

    const currentMonth = new Date().toLocaleString('default', {
      month: 'long',
    });
    const currentYear = new Date().getFullYear();

    const prompt = `As a world-class SEO strategist, generate EXACTLY 15 strategically diverse seed keywords for comprehensive keyword research.

**PRODUCT CONTEXT:**
Name: ${name}
Description: ${description}
Target Audiences: ${targetAudiences.join(', ')}
Website: ${url}
Date: ${currentMonth} ${currentYear}

**STRATEGIC SEED KEYWORD FRAMEWORK:**

Generate keywords across these strategic categories (aim for 2-3 per category):

1. **Problem/Pain Point Keywords** - What problems does this product solve?
2. **Feature/Capability Keywords** - Core product features
3. **Use Case Keywords** - Industry applications
4. **Comparison Keywords** - "vs", "alternative to", "best" queries
5. **Educational Keywords** - "How to", "What is" queries
6. **Long-tail Keywords** - Specific, low-competition phrases
7. **Commercial Intent** - Buying signals ("pricing", "review", "for [use case]")

**CRITICAL REQUIREMENTS:**
- Output EXACTLY 15 keywords (DataForSEO API limit is 20, we need buffer)
- Mix of head terms (1-2 words) and long-tail (3+ words)
- Focus on problems/solutions, not branded terms
- Include both informational and commercial intent
- Prioritize keywords that will expand into many related terms

Output exactly 15 diverse, high-quality seed keywords.`;

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

      // CRITICAL: DataForSEO has a max limit of 20 keywords per request
      // Ensure we never exceed this limit
      const limitedSeeds = result.object.keywords.slice(0, 20);

      if (result.object.keywords.length > 20) {
        console.warn(
          `⚠️ AI generated ${result.object.keywords.length} seeds, limiting to 20 for DataForSEO API`
        );
      }

      return {
        product: inputData,
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
    seedKeywords: z.array(z.string()),
  }),
  outputSchema: z.object({
    product: ProductInputSchema,
    seedKeywords: z.array(z.string()),
    existingKeywords: z.array(z.string()),
  }),
  execute: async ({ inputData }) => {
    const { product, seedKeywords } = inputData;

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
    seedKeywords: z.array(z.string()),
    existingKeywords: z.array(z.string()),
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
    const { product, seedKeywords, existingKeywords } = inputData;
    const api = getDataForSEOClient();

    console.log(
      `Starting comprehensive keyword research with ${seedKeywords.length} seed keywords`
    );
    console.log(
      `Excluding ${existingKeywords.length} already-used keywords from search`
    );

    // CRITICAL VALIDATION: DataForSEO limit is 20 keywords per request
    if (seedKeywords.length > 20) {
      throw new Error(
        `DataForSEO API limit exceeded: ${seedKeywords.length} seeds provided, max is 20. This should never happen - check seed generation step.`
      );
    }

    try {
      // STEP 1: Get keyword ideas and search volume data from DataForSEO
      const task =
        new DataForSEO.KeywordsDataGoogleAdsKeywordsForKeywordsLiveRequestInfo();
      task.language_code = product.language || 'en';
      task.location_code = getLocationCode(product.country);
      task.keywords = seedKeywords;
      task.search_partners = false;
      task.include_adult_keywords = false;
      task.sort_by = 'search_volume';
      task.include_seed_keyword = true;
      task.include_serp_info = true;

      const response = await api.googleAdsKeywordsForKeywordsLive([task]);

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

      console.log(
        `DataForSEO returned ${taskResult.result?.length || 0} keyword ideas`
      );

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

      // STEP 3: Extract and validate keywords with REAL DataForSEO data only
      // Filter for good traffic/difficulty ratio
      if (taskResult.result && taskResult.result.length > 0) {
        for (const item of taskResult.result) {
          // CRITICAL: Only use keywords with REAL search volume and difficulty data
          if (
            !item ||
            !item.keyword ||
            item.search_volume === null ||
            item.search_volume === undefined ||
            item.competition_index === null ||
            item.competition_index === undefined
          ) {
            continue; // Skip items without real data
          }

          // Skip if already used in previous runs
          if (
            existingKeywords.some(
              (existingKw) => existingKw === item.keyword?.toLowerCase()
            )
          ) {
            continue;
          }

          // Skip if already added in this batch
          if (keywordData.some((kw) => kw.keyword === item.keyword)) continue;

          // Filter for minimum quality: at least 10 searches/month
          if (item.search_volume < 10) continue;

          // Calculate traffic/difficulty ratio for ranking potential
          const trafficDifficultyRatio =
            item.search_volume / Math.max(item.competition_index, 1);

          const competitionScore = item.competition_index / 100;

          // Calculate trend from monthly searches
          const trend = calculateTrend(
            item.monthly_searches as
              | Array<{
                  year?: number;
                  month?: number;
                  search_volume?: number;
                }>
              | undefined
          );

          // Format monthly searches
          const monthlySearches = item.monthly_searches
            ?.slice(0, 12)
            .filter((m): m is NonNullable<typeof m> => m !== undefined)
            .map((m) => ({
              month: `${m.year || 0}-${String(m.month || 0).padStart(2, '0')}`,
              volume: m.search_volume || 0,
            }));

          keywordData.push({
            keyword: item.keyword,
            searchVolume: item.search_volume, // REAL data from API
            difficulty: item.competition_index, // REAL data from API
            cpc: item.cpc || 0,
            competition: competitionScore,
            monthlySearches,
            trend,
          });
        }
      }

      console.log(
        `Extracted ${keywordData.length} keywords with real DataForSEO metrics`
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
});

// Step 4: Analyze keywords for SEO potential (simplified - no content generation)
const analyzeKeywordsStep = createStep({
  id: 'analyze-keywords',
  inputSchema: z.object({
    product: ProductInputSchema,
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
    analyzedKeywords: z.array(KeywordWithoutScheduleSchema),
  }),
  execute: async ({ inputData }) => {
    const { product, keywordData } = inputData;

    const prompt = `You are a world-class SEO strategist analyzing ${keywordData.length} keywords for keyword discovery.

**PRODUCT CONTEXT:**
Name: ${product.name}
Description: ${product.description}
Target Audiences: ${product.targetAudiences.join(', ')}

**KEYWORDS TO ANALYZE:**
${keywordData
  .map(
    (kw, i) =>
      `${i + 1}. "${kw.keyword}"
   - Search Volume: ${kw.searchVolume}/mo
   - Keyword Difficulty: ${kw.difficulty}/100
   - CPC: $${(kw.cpc || 0).toFixed(2)}
   - Traffic/Difficulty Ratio: ${(kw.searchVolume / Math.max(kw.difficulty, 1)).toFixed(1)}
   - Trend: ${kw.trend ? (kw.trend > 0 ? `📈 +${(kw.trend * 100).toFixed(0)}%` : `📉 ${(kw.trend * 100).toFixed(0)}%`) : 'Stable'}`
  )
  .join('\n\n')}

**ANALYSIS FRAMEWORK:**

For each keyword, provide strategic analysis (NO content generation):

**1. SEARCH INTENT**
- informational: "how to", "what is", learning queries
- navigational: Brand/product searches
- commercial: "best", "review", research before buying
- transactional: "buy", "pricing", ready to purchase

**2. BUSINESS POTENTIAL** (Critical - how well does this keyword fit our product?)
- "3" = Product is THE solution (perfect fit, high conversion potential)
- "2" = Product is A solution (good fit, can naturally mention)
- "1" = Product tangentially related (weak fit)
- "0" = No product fit (avoid - waste of resources)

**3. TRAFFIC POTENTIAL** (Realistic monthly traffic if ranked #1-3)
Estimate actual traffic considering:
- Position 1-3 CTR (~30-40%)
- Related keyword traffic
- SERP features

**4. PARENT TOPIC** (Group keywords to avoid cannibalization)
Broader topic this keyword belongs to.
Example: "best espresso machine" → parent: "espresso machines"

**5. COMPETITOR GAP**
Is this a low-hanging fruit opportunity?
- true: Good volume + low difficulty (KD < 50 with volume > 100, OR KD < 70 with volume > 500)
- false: Competitive

**6. STRATEGIC RATIONALE**
ONE sentence explaining why this keyword is valuable for ${product.name}.

**IMPORTANT:**
- Be brutally honest about business potential (BP=0 if no fit)
- Traffic potential should be realistic (not just search volume)
- Parent topics help avoid multiple articles competing for same keywords

Analyze ALL ${keywordData.length} keywords.`;

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
          // Base: Traffic/difficulty ratio (max 40 points)
          const ratioScore = Math.min((trafficDifficultyRatio / 100) * 40, 40);

          // Volume score (max 20 points)
          const volumeScore = Math.min((data.searchVolume / 1000) * 20, 20);

          // CPC score - commercial value (max 15 points)
          const cpcScore = Math.min(((data.cpc || 0) / 5) * 15, 15);

          // Trend bonus (5 points)
          const trendBonus = (data.trend || 0) > 0 ? 5 : 0;

          // Business potential multiplier (most important!)
          const bpMultiplier =
            analyzed?.businessPotential === '3'
              ? 1.4
              : analyzed?.businessPotential === '2'
                ? 1.2
                : analyzed?.businessPotential === '1'
                  ? 1.0
                  : 0.5;

          // Competitor gap bonus
          const gapBonus = analyzed?.competitorGap ? 10 : 0;

          const baseScore =
            ratioScore + volumeScore + cpcScore + trendBonus + gapBonus;
          return Math.min(Math.round(baseScore * bpMultiplier), 100);
        };

        if (!analysis) {
          // Fallback if AI didn't analyze this keyword
          const priorityScore = calculatePriorityScore(kw);
          return {
            keyword: kw.keyword,
            searchVolume: kw.searchVolume,
            keywordDifficulty: kw.difficulty,
            cpc: kw.cpc,
            competition: kw.competition,
            searchIntent: 'informational' as const,
            businessPotential: '1' as const,
            trafficPotential: Math.round(kw.searchVolume * 0.35), // ~35% CTR for top 3
            parentTopic: undefined,
            trendScore: kw.trend,
            competitorGap: kw.difficulty < 50 && kw.searchVolume > 100,
            priorityScore,
            trafficDifficultyRatio,
            rationale:
              'Keyword requires manual review - AI analysis unavailable',
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
        };
      });

      console.log(`Completed analysis of ${analyzedKeywords.length} keywords`);

      return {
        product,
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

    // Sort by priority score (high to low)
    const sortedKeywords = [...analyzedKeywords].sort(
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

    // Select up to 30 unique keywords (may be less if not enough available)
    const final30Keywords = uniqueKeywords.slice(0, 30);

    if (final30Keywords.length < 30) {
      console.warn(
        `⚠️ Only ${final30Keywords.length} unique keywords available (expected 30). Consider broadening seed keywords or adjusting filters.`
      );
    } else {
      console.log(
        `✅ Selected 30 unique keywords from ${sortedKeywords.length} candidates`
      );
    }

    // Add scheduledDate to each keyword (1 per day for 30 days)
    const keywordsWithSchedule = final30Keywords.map((kw, index) => {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + index); // Day 0, 1, 2, ... 29

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

    console.log(`
📊 KEYWORD DISCOVERY SUMMARY:
- Total Keywords: ${keywordsWithSchedule.length} ${keywordsWithSchedule.length === 30 ? '✅' : `⚠️ (target: 30)`}
- All keywords are UNIQUE (no duplicates)
- Avg Search Volume: ${stats.avgSearchVolume.toLocaleString()}/mo
- Avg Difficulty: ${stats.avgDifficulty}/100
- Avg Priority Score: ${stats.avgPriorityScore}/100
- High Business Potential (BP=3): ${stats.highBusinessPotential} keywords
- Competitor Gap Opportunities: ${stats.competitorGaps} keywords
- Total Traffic Potential: ${stats.totalTrafficPotential.toLocaleString()}/month
- Avg Traffic/Difficulty Ratio: ${(keywordsWithSchedule.reduce((sum, kw) => sum + kw.trafficDifficultyRatio, 0) / keywordsWithSchedule.length).toFixed(1)}
- Schedule: ${keywordsWithSchedule[0]?.scheduledDate.split('T')[0] || 'N/A'} to ${lastKeyword?.scheduledDate.split('T')[0] || 'N/A'}

Top 10 Keywords by Priority:
${keywordsWithSchedule
  .slice(0, 10)
  .map(
    (kw, i) =>
      `${i + 1}. ${kw.keyword} (Priority: ${kw.priorityScore}, Volume: ${kw.searchVolume}, Difficulty: ${kw.keywordDifficulty}, BP: ${kw.businessPotential}, Date: ${kw.scheduledDate.split('T')[0]})`
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
    Keyword discovery workflow using DataForSEO and AI analysis:
    
    FOCUS: Find high-potential keywords with good traffic/difficulty ratios
    
    Steps:
    1. Generate strategic seed keywords across 7 categories
    2. Fetch existing keywords to avoid duplicates  
    3. Expand via DataForSEO with REAL search volume & difficulty data
    4. AI analysis: search intent, business potential, traffic estimation
    5. Sort by priority score and return with comprehensive stats
    
    Output: Sorted list of keywords with metrics (NO content generation)
  `,
  inputSchema: ProductInputSchema,
  outputSchema: OutputSchema,
})
  .then(generateSeedKeywordsStep)
  .then(fetchExistingArticlesStep)
  .then(getKeywordDataStep)
  .then(analyzeKeywordsStep)
  .then(finalizeKeywordsStep)
  .commit();

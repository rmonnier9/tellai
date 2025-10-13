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

// Enhanced business intelligence schema for ICP, JTBD, and funnel analysis
const BusinessIntelligenceSchema = z.object({
  idealCustomerProfile: z.object({
    demographics: z
      .array(z.string())
      .describe('Who are they? (role, company size, industry)'),
    psychographics: z.array(z.string()).describe('How do they think/behave?'),
    painPoints: z
      .array(z.string())
      .describe('What problems keep them up at night?'),
  }),
  jobsToBeDone: z.array(
    z.object({
      functionalJob: z
        .string()
        .describe('What task are they trying to accomplish?'),
      emotionalJob: z.string().describe('How do they want to feel?'),
      socialJob: z
        .string()
        .optional()
        .describe('How do they want to be perceived?'),
    })
  ),
  funnelStages: z.object({
    awareness: z
      .array(z.string())
      .describe('Top-of-funnel: problem discovery keywords'),
    consideration: z
      .array(z.string())
      .describe('Mid-funnel: solution research keywords'),
    decision: z
      .array(z.string())
      .describe('Bottom-funnel: ready-to-buy keywords'),
  }),
  valuePropositions: z
    .array(z.string())
    .describe('Unique value propositions vs competitors'),
  negativeKeywords: z.object({
    wrongICP: z
      .array(z.string())
      .describe('Keywords indicating wrong customer profile'),
    wrongIntent: z
      .array(z.string())
      .describe('Keywords with wrong purchase/usage intent'),
    competitors: z
      .array(z.string())
      .describe('Direct competitor brand terms to avoid'),
    unsupportedUseCases: z
      .array(z.string())
      .describe('Use cases the product does not solve'),
  }),
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

// Step 1: Analyze business context with ICP, JTBD, and funnel intelligence
const analyzeBusinessContextStep = createStep({
  id: 'analyze-business-context',
  inputSchema: ProductInputSchema,
  outputSchema: z.object({
    product: ProductInputSchema,
    businessIntelligence: BusinessIntelligenceSchema,
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

    console.log(
      `\n🔍 Analyzing business context with ICP & JTBD framework for: ${name}`
    );

    const prompt = `You are a business strategist and SEO expert. Perform a DEEP business analysis to generate business-oriented keyword research strategy.

**BUSINESS CONTEXT:**
Name: ${name}
Description: ${description}
Target Audiences: ${targetAudiences.join(', ')}
Website: ${url}

**YOUR MISSION:**
Extract strategic business intelligence to drive keyword discovery that CONVERTS, not just ranks.

**PART 1: IDEAL CUSTOMER PROFILE (ICP)**
Identify WHO will buy this product:

1. **demographics** (5-8 items): Concrete attributes
   - Job titles/roles (e.g., "marketing manager", "small business owner")
   - Company size (e.g., "1-10 employees", "enterprise 500+")
   - Industry verticals (e.g., "e-commerce", "SaaS", "healthcare")
   - Geographic markets
   - Budget/pricing tier indicators

2. **psychographics** (4-6 items): How they think/behave
   - Personality traits (e.g., "data-driven", "hands-on", "time-starved")
   - Preferred channels (e.g., "reads reddit", "attends webinars")
   - Decision-making style (e.g., "needs social proof", "price-sensitive")

3. **painPoints** (5-8 items): Specific problems they face
   - Current struggles (e.g., "manually managing spreadsheets")
   - Frustrations with alternatives (e.g., "existing tools too complex")
   - Business impact (e.g., "losing customers to slow response times")

**PART 2: JOBS TO BE DONE (JTBD)**
What are customers "hiring" this product to do? Generate 4-6 jobs:

Each job must include:
- **functionalJob**: The literal task (e.g., "track customer emails automatically")
- **emotionalJob**: Desired feeling (e.g., "feel confident I'm not missing leads")
- **socialJob** (optional): Perception (e.g., "be seen as data-driven by my team")

**PART 3: FUNNEL STAGES**
Generate 8-12 keywords PER stage based on ICP & JTBD:

1. **awareness** (problem-focused): What they search BEFORE knowing solutions exist
   - Problem symptom keywords
   - Industry challenge terms
   - "How to solve X" patterns

2. **consideration** (solution-focused): Researching solution categories
   - Solution category terms
   - Comparison keywords (feature A vs feature B, not brands)
   - Educational content keywords

3. **decision** (purchase-focused): Ready to buy, evaluating options
   - High-intent commercial terms
   - Pricing/cost related keywords
   - Implementation/setup keywords

**PART 4: VALUE PROPOSITIONS**
List 4-6 unique value props that differentiate from competitors:
   - What makes this product different/better?
   - Unique features or approaches
   - Competitive advantages

**PART 5: NEGATIVE KEYWORDS**
Define what to EXCLUDE for better business fit:

1. **wrongICP** (6-10 terms): Keywords indicating wrong customer
   - Wrong market segment (B2B product getting B2C keywords)
   - Wrong company size (enterprise tool getting solopreneur searches)
   - Wrong use cases

2. **wrongIntent** (6-10 terms): Wrong purchase/usage intent
   - DIY/free-only seekers when product is paid
   - Troubleshooting competitor problems
   - Informational only (no commercial intent)

3. **competitors** (8-12 terms): Direct competitor brands to avoid
   - Competitor brand names (lowercase)
   - Their product names
   - Major category leaders

4. **unsupportedUseCases** (5-8 terms): What product does NOT do
   - Features not offered
   - Industries not served
   - Use cases out of scope

**CRITICAL RULES:**
- ALL terms must be lowercase
- Be SPECIFIC to this business, not generic marketing advice
- Focus on COMMERCIAL INTENT throughout the funnel
- ICP should be narrow and actionable
- JTBD should reveal search behavior patterns
- Funnel keywords should progress from problem → solution → purchase
- Negative keywords should be comprehensive to filter aggressively

Think like a growth marketer optimizing for CAC and LTV, not just traffic.

Return your complete analysis.`;

    try {
      const result = await contextAnalyst.generateVNext(prompt, {
        output: BusinessIntelligenceSchema,
      });

      console.log(`✅ Generated business intelligence:`);
      console.log(
        `   • ICP Demographics: ${result.object.idealCustomerProfile.demographics.length} attributes`
      );
      console.log(
        `   • ICP Psychographics: ${result.object.idealCustomerProfile.psychographics.length} traits`
      );
      console.log(
        `   • ICP Pain Points: ${result.object.idealCustomerProfile.painPoints.length} problems`
      );
      console.log(
        `   • Jobs To Be Done: ${result.object.jobsToBeDone.length} jobs`
      );
      console.log(
        `   • Awareness Keywords: ${result.object.funnelStages.awareness.length} terms`
      );
      console.log(
        `   • Consideration Keywords: ${result.object.funnelStages.consideration.length} terms`
      );
      console.log(
        `   • Decision Keywords: ${result.object.funnelStages.decision.length} terms`
      );
      console.log(
        `   • Value Propositions: ${result.object.valuePropositions.length} differentiators`
      );
      console.log(
        `   • Negative Keywords: ${result.object.negativeKeywords.wrongICP.length + result.object.negativeKeywords.wrongIntent.length + result.object.negativeKeywords.competitors.length + result.object.negativeKeywords.unsupportedUseCases.length} filters`
      );

      // Convert business intelligence into legacy filtering format for compatibility
      const filteringCriteria = {
        brandedTerms: result.object.negativeKeywords.competitors,
        relevantContext: [
          ...result.object.idealCustomerProfile.demographics.flatMap((d) =>
            d.toLowerCase().split(/\s+/)
          ),
          ...result.object.valuePropositions.flatMap((v) =>
            v.toLowerCase().split(/\s+/)
          ),
        ].slice(0, 15),
        genericTerms: [
          ...result.object.negativeKeywords.wrongIntent,
          ...result.object.negativeKeywords.unsupportedUseCases,
        ],
      };

      return {
        product: inputData,
        businessIntelligence: result.object,
        filteringCriteria,
      };
    } catch (error) {
      console.error('Failed to analyze business context:', error);
      throw new Error(
        `Business context analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});

// Step 2: Generate business-oriented seed keywords using ICP, JTBD, and funnel intelligence
const generateSeedKeywordsStep = createStep({
  id: 'generate-seed-keywords',
  inputSchema: z.object({
    product: ProductInputSchema,
    businessIntelligence: BusinessIntelligenceSchema,
    filteringCriteria: z.object({
      brandedTerms: z.array(z.string()),
      relevantContext: z.array(z.string()),
      genericTerms: z.array(z.string()),
    }),
  }),
  outputSchema: z.object({
    product: ProductInputSchema,
    businessIntelligence: BusinessIntelligenceSchema,
    filteringCriteria: z.object({
      brandedTerms: z.array(z.string()),
      relevantContext: z.array(z.string()),
      genericTerms: z.array(z.string()),
    }),
    seedKeywords: z.array(z.string()),
  }),
  execute: async ({ inputData }) => {
    const { product, businessIntelligence, filteringCriteria } = inputData;
    const { name, description, targetAudiences, url } = product;

    const currentMonth = new Date().toLocaleString('default', {
      month: 'long',
    });
    const currentYear = new Date().getFullYear();

    const prompt = `As an expert growth marketer and SEO strategist, generate EXACTLY ${KEYWORD_CONFIG.SEED_KEYWORDS_COUNT} BUSINESS-ORIENTED seed keywords that will drive CONVERSIONS, not just traffic.

**PRODUCT CONTEXT:**
Name: ${name}
Description: ${description}
Target Audiences: ${targetAudiences.join(', ')}
Website: ${url}
Date: ${currentMonth} ${currentYear}

**IDEAL CUSTOMER PROFILE:**
Demographics: ${businessIntelligence.idealCustomerProfile.demographics.join(' | ')}
Pain Points: ${businessIntelligence.idealCustomerProfile.painPoints.join(' | ')}
Psychographics: ${businessIntelligence.idealCustomerProfile.psychographics.join(' | ')}

**JOBS TO BE DONE:**
${businessIntelligence.jobsToBeDone.map((job, i) => `${i + 1}. Functional: ${job.functionalJob} | Emotional: ${job.emotionalJob}${job.socialJob ? ` | Social: ${job.socialJob}` : ''}`).join('\n')}

**VALUE PROPOSITIONS:**
${businessIntelligence.valuePropositions.map((vp, i) => `${i + 1}. ${vp}`).join('\n')}

**FUNNEL STAGE KEYWORDS (for context):**
Awareness: ${businessIntelligence.funnelStages.awareness.slice(0, 5).join(', ')}...
Consideration: ${businessIntelligence.funnelStages.consideration.slice(0, 5).join(', ')}...
Decision: ${businessIntelligence.funnelStages.decision.slice(0, 5).join(', ')}...

**NEGATIVE KEYWORDS TO AVOID:**
❌ Competitors: ${filteringCriteria.brandedTerms.join(', ')}
❌ Wrong ICP: ${businessIntelligence.negativeKeywords.wrongICP.join(', ')}
❌ Wrong Intent: ${businessIntelligence.negativeKeywords.wrongIntent.join(', ')}
❌ Unsupported: ${businessIntelligence.negativeKeywords.unsupportedUseCases.join(', ')}

**YOUR MISSION:**
Generate ${KEYWORD_CONFIG.SEED_KEYWORDS_COUNT} DIVERSE seed keywords with strong emphasis on MID-TAIL (3-4 words) and LONG-TAIL (5+ words) variations that will expand into high-converting keyword clusters.

**SEED DIVERSITY REQUIREMENTS:**
- **30% Short-tail** (2-3 words): Core topics - e.g., "customer support automation"
- **45% Mid-tail** (3-4 words): Specific use cases - e.g., "automate customer support emails"
- **25% Long-tail** (5+ words): Very specific queries - e.g., "how to automate customer support responses for small business"

**KEYWORD LENGTH PATTERNS TO INCLUDE:**
- Question-based: "how to [achieve JTBD]", "what is [solution]", "why [pain point]"
- Modifier-based: "best [solution] for [ICP]", "[solution] guide for [audience]"
- Problem-solution: "[pain point] solution", "fix [problem] with [solution type]"
- Use-case specific: "[solution] for [industry/role]", "[feature] to [outcome]"
- Comparison-based: "[solution A] vs [solution B]", "[solution] alternatives for [ICP]"

**STRATEGIC FRAMEWORK - Distribute ${KEYWORD_CONFIG.SEED_KEYWORDS_COUNT} seeds across:**

1. **ICP Pain Point Keywords (~${Math.ceil(KEYWORD_CONFIG.SEED_KEYWORDS_COUNT * 0.25)} seeds, 25%)**
   - Exact pain points from ICP analysis
   - Problems the target customer faces daily
   - Include question format: "how to solve [pain point]"
   - Include long-tail: "[pain point] solution for [ICP demographic]"
   - Example short: "track customer emails"
   - Example mid: "automatically track customer emails"
   - Example long: "how to automatically track customer support emails for small teams"

2. **JTBD Functional Job Keywords (~${Math.ceil(KEYWORD_CONFIG.SEED_KEYWORDS_COUNT * 0.25)} seeds, 25%)**
   - What customers are trying to accomplish
   - Task-oriented search terms with context
   - Include role/industry modifiers
   - Example short: "automate support responses"
   - Example mid: "automate customer support ticket responses"
   - Example long: "automate repetitive customer support responses for saas companies"

3. **Funnel-Aware Keywords (~${Math.ceil(KEYWORD_CONFIG.SEED_KEYWORDS_COUNT * 0.3)} seeds, 30%)**
   - Awareness (problem): "challenges with [problem]", "why [pain point] happens"
   - Consideration (solution): "[solution type] guide", "best [solution] for [ICP]"
   - Decision (purchase): "[solution] pricing for [ICP]", "implement [solution] for [use case]"
   - Mix short, mid, and long-tail across all stages

4. **Value Proposition Keywords (~${Math.ceil(KEYWORD_CONFIG.SEED_KEYWORDS_COUNT * 0.2)} seeds, 20%)**
   - Feature + benefit + ICP combinations
   - Competitive advantage phrases
   - Example short: "ai customer support"
   - Example mid: "ai powered support automation"
   - Example long: "ai powered customer support automation for growing saas companies"

**CRITICAL REQUIREMENTS:**
- Output EXACTLY ${KEYWORD_CONFIG.SEED_KEYWORDS_COUNT} unique keywords
- At least 45% must be MID-TAIL (3-4 words) - this is the sweet spot for conversions
- At least 25% must be LONG-TAIL (5+ words) - these convert best and rank easier
- Each keyword MUST align with the ICP (right customer, right intent, right stage)
- Include varied modifiers: how to, best, guide, for [ICP], solution, tool, software
- NO competitor brands, NO generic terms, NO wrong ICP terms
- All keywords lowercase
- NO overly broad 1-word seeds

**EXPANSION STRATEGY:**
These ${KEYWORD_CONFIG.SEED_KEYWORDS_COUNT} diverse seeds will expand to 100+ related keywords via DataForSEO. 
Choose seeds that will branch into different keyword clusters (problem-focused, solution-focused, comparison-focused, etc.).

Think: Each seed should unlock a unique cluster of 20-30 related mid-tail and long-tail keywords.

Output exactly ${KEYWORD_CONFIG.SEED_KEYWORDS_COUNT} business-oriented seed keywords with heavy emphasis on 3-6 word phrases.`;

    try {
      const result = await seoStrategist.generateVNext(prompt, {
        output: z.object({
          keywords: z
            .array(z.string())
            .describe(
              'Business-oriented seed keywords aligned with ICP, JTBD, and funnel stages'
            ),
        }),
      });

      console.log(
        `Generated ${result.object.keywords.length} business-oriented seed keywords`
      );

      // Log keyword length distribution for debugging
      const shortTail = result.object.keywords.filter(
        (k) => k.split(' ').length <= 3
      ).length;
      const midTail = result.object.keywords.filter(
        (k) => k.split(' ').length >= 3 && k.split(' ').length <= 4
      ).length;
      const longTail = result.object.keywords.filter(
        (k) => k.split(' ').length >= 5
      ).length;

      console.log(`📊 Seed keyword distribution:`);
      console.log(
        `   • Short-tail (2-3 words): ${shortTail} (${Math.round((shortTail / result.object.keywords.length) * 100)}%)`
      );
      console.log(
        `   • Mid-tail (3-4 words): ${midTail} (${Math.round((midTail / result.object.keywords.length) * 100)}%)`
      );
      console.log(
        `   • Long-tail (5+ words): ${longTail} (${Math.round((longTail / result.object.keywords.length) * 100)}%)`
      );

      // Return ALL seeds - we'll batch DataForSEO calls in the next step if needed
      return {
        product,
        businessIntelligence,
        filteringCriteria,
        seedKeywords: result.object.keywords,
      };
    } catch (error) {
      throw new Error(
        `Failed to generate seed keywords: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});

// Step 3: Fetch existing articles to avoid duplicates
const fetchExistingArticlesStep = createStep({
  id: 'fetch-existing-articles',
  inputSchema: z.object({
    product: ProductInputSchema,
    businessIntelligence: BusinessIntelligenceSchema,
    filteringCriteria: z.object({
      brandedTerms: z.array(z.string()),
      relevantContext: z.array(z.string()),
      genericTerms: z.array(z.string()),
    }),
    seedKeywords: z.array(z.string()),
  }),
  outputSchema: z.object({
    product: ProductInputSchema,
    businessIntelligence: BusinessIntelligenceSchema,
    filteringCriteria: z.object({
      brandedTerms: z.array(z.string()),
      relevantContext: z.array(z.string()),
      genericTerms: z.array(z.string()),
    }),
    seedKeywords: z.array(z.string()),
    existingKeywords: z.array(z.string()),
  }),
  execute: async ({ inputData }) => {
    const { product, businessIntelligence, filteringCriteria, seedKeywords } =
      inputData;

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
        businessIntelligence,
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
        businessIntelligence,
        filteringCriteria,
        seedKeywords,
        existingKeywords: [],
      };
    }
  },
});

// Step 4: Get comprehensive keyword data from DataForSEO
const getKeywordDataStep = createStep({
  id: 'get-keyword-data',
  inputSchema: z.object({
    product: ProductInputSchema,
    businessIntelligence: BusinessIntelligenceSchema,
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
    businessIntelligence: BusinessIntelligenceSchema,
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
    const {
      product,
      businessIntelligence,
      filteringCriteria,
      seedKeywords,
      existingKeywords,
    } = inputData;
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

    try {
      // STEP 1: Batch seeds if we exceed DataForSEO limit per request
      const batchSize = KEYWORD_CONFIG.DATAFORSEO_SEED_LIMIT;
      const batches: string[][] = [];

      for (let i = 0; i < seedKeywords.length; i += batchSize) {
        batches.push(seedKeywords.slice(i, i + batchSize));
      }

      console.log(
        `📦 Batching ${seedKeywords.length} seeds into ${batches.length} DataForSEO API call(s) (max ${batchSize} seeds per call)`
      );

      // STEP 2: Execute all batches and aggregate results
      const allKeywordItems: any[] = [];
      let totalCount = 0;

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        if (!batch || batch.length === 0) {
          console.warn(`⚠️ Skipping empty batch ${batchIndex + 1}`);
          continue;
        }

        console.log(
          `📡 Fetching batch ${batchIndex + 1}/${batches.length} with ${batch.length} seeds...`
        );

        const task =
          new DataForSEO.DataforseoLabsGoogleKeywordIdeasLiveRequestInfo();
        task.language_code = product.language || 'en';
        task.location_code = getLocationCode(product.country);
        task.keywords = batch;
        task.include_seed_keyword = true;
        task.include_serp_info = true;
        task.include_clickstream_data = true; // Get normalized search volumes with real user data
        task.limit = KEYWORD_CONFIG.DATAFORSEO_RESULTS_LIMIT; // Get comprehensive keyword ideas per batch
        task.filters = [
          ['keyword_info.search_volume', '>', 0], // Only keywords with search volume
        ];
        task.order_by = ['keyword_info.search_volume,desc']; // Sort by search volume

        const response = await api.googleKeywordIdeasLive([task]);

        if (!response || !response.tasks || response.tasks.length === 0) {
          throw new Error(
            `No data returned from DataForSEO for batch ${batchIndex + 1}`
          );
        }

        const taskResult = response.tasks[0];
        if (!taskResult) {
          throw new Error(
            `No task result returned from DataForSEO for batch ${batchIndex + 1}`
          );
        }

        if (taskResult.status_code !== 20000) {
          throw new Error(
            `DataForSEO error in batch ${batchIndex + 1}: ${taskResult.status_message || 'Unknown error'}`
          );
        }

        // CRITICAL: DataForSEO Labs API returns data in result[0].items, not result directly
        const resultData = taskResult.result?.[0];
        const batchItems = resultData?.items || [];

        console.log(
          `✅ Batch ${batchIndex + 1}/${batches.length} returned ${batchItems.length} keyword ideas (total_count: ${resultData?.total_count || 0})`
        );

        // Aggregate results from this batch
        allKeywordItems.push(...batchItems);
        totalCount += resultData?.total_count || 0;
      }

      // STEP 3: Log aggregated results
      console.log(`\n📊 DataForSEO Labs API Summary:`);
      console.log(`   • Total batches processed: ${batches.length}`);
      console.log(
        `   • Total keyword ideas retrieved: ${allKeywordItems.length}`
      );
      console.log(`   • Total available keywords: ${totalCount}`);

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

      // Use aggregated results instead of single batch
      const keywordItems = allKeywordItems;

      console.log(`\nProcessing ${keywordItems.length} total keyword ideas...`);

      // STEP 4: Calculate trend scores from monthly search volumes
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

      // STEP 5: Extract keywords with superior DataForSEO Labs data
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
- Total results from API (all batches): ${keywordItems.length} (from ${totalCount} total available)
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

      // STEP 6: Sort by traffic/difficulty ratio (best opportunities first)
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
        businessIntelligence,
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

// Step 5: Analyze keywords for business potential using ICP & JTBD
const analyzeKeywordsStep = createStep({
  id: 'analyze-keywords',
  inputSchema: z.object({
    product: ProductInputSchema,
    businessIntelligence: BusinessIntelligenceSchema,
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
    businessIntelligence: BusinessIntelligenceSchema,
    filteringCriteria: z.object({
      brandedTerms: z.array(z.string()),
      relevantContext: z.array(z.string()),
      genericTerms: z.array(z.string()),
    }),
    analyzedKeywords: z.array(KeywordWithoutScheduleSchema),
  }),
  execute: async ({ inputData }) => {
    const { product, businessIntelligence, filteringCriteria, keywordData } =
      inputData;

    const prompt = `You are a growth marketing expert. Analyze keywords for BUSINESS POTENTIAL using the ICP and JTBD framework.

**PRODUCT:** ${product.name}
${product.description}

**IDEAL CUSTOMER PROFILE:**
Demographics: ${businessIntelligence.idealCustomerProfile.demographics.join(' | ')}
Pain Points: ${businessIntelligence.idealCustomerProfile.painPoints.join(' | ')}
Psychographics: ${businessIntelligence.idealCustomerProfile.psychographics.join(' | ')}

**JOBS TO BE DONE:**
${businessIntelligence.jobsToBeDone.map((job, i) => `${i + 1}. ${job.functionalJob} (Emotional: ${job.emotionalJob})`).join('\n')}

**VALUE PROPOSITIONS:**
${businessIntelligence.valuePropositions.map((vp, i) => `${i + 1}. ${vp}`).join('\n')}

**KEYWORDS TO ANALYZE (${keywordData.length}):**
${keywordData
  .map(
    (kw, i) =>
      `${i + 1}. "${kw.keyword}" | Vol: ${kw.searchVolume} | Diff: ${kw.difficulty} | CPC: $${(kw.cpc || 0).toFixed(2)}`
  )
  .join('\n')}

**YOUR TASK:**
For EACH keyword, analyze:

1. **searchIntent**: 
   - informational: "how to", "what is", learning
   - navigational: looking for specific brand/page
   - commercial: "best", "review", researching options
   - transactional: "buy", "pricing", ready to purchase

2. **businessPotential** (CRITICAL - be strict):
   - "3" = PERFECT fit: Searcher matches ICP, has pain point we solve, shows buying intent
   - "2" = GOOD fit: Matches ICP OR pain point, moderate commercial intent
   - "1" = WEAK fit: Tangentially related, low commercial intent
   - "0" = NO fit: Wrong ICP, wrong problem, no business value
   
   **Scoring criteria:**
   - Does searcher match ICP demographics? (+1 point)
   - Does keyword relate to a JTBD functional job? (+1 point)
   - Does keyword indicate they have our ICP's pain points? (+1 point)
   - High CPC or commercial intent? (boost to "3" if otherwise "2")
   - Wrong ICP or intent? (force to "0" or "1")

3. **trafficPotential**: Estimated monthly traffic if ranked #1-3 (use ~${Math.round(KEYWORD_CONFIG.TOP_3_CTR * 100)}% of search volume)

4. **parentTopic**: Broader category (e.g., "email marketing", "customer support") - helps avoid keyword cannibalization

5. **competitorGap**: true if KD<${KEYWORD_CONFIG.GAP_DIFFICULTY_LOW} AND volume>${KEYWORD_CONFIG.GAP_VOLUME_LOW}, OR KD<${KEYWORD_CONFIG.GAP_DIFFICULTY_MEDIUM} AND volume>${KEYWORD_CONFIG.GAP_VOLUME_MEDIUM}; false otherwise

6. **rationale**: One sentence explaining businessPotential score based on ICP & JTBD fit

7. **recommendedContentType**: "guide" or "listicle"

8. **recommendedSubtype**: 
   - If guide: "how_to", "explainer", "comparison", or "reference"
   - If listicle: "round_up", "resources", or "examples"

9. **contentTypeRationale**: Why this format matches user intent & will rank

**CRITICAL RULES:**
- Be STRICT with businessPotential scoring - focus on conversion potential, not just traffic
- Consider ICP fit: wrong customer profile = BP ≤ 1
- Consider JTBD alignment: keyword must relate to what customer is trying to accomplish
- Consider pain point match: does this keyword indicate they have our ICP's problems?
- High-volume generic keywords with no business fit = BP 0 or 1
- MUST analyze ALL ${keywordData.length} keywords

Think: "Will someone searching this keyword actually BUY our product?"

Return complete analysis for EVERY keyword.`;

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
        businessIntelligence,
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

// Step 6: Finalize and return discovered keywords with stats
const finalizeKeywordsStep = createStep({
  id: 'finalize-keywords',
  inputSchema: z.object({
    product: ProductInputSchema,
    businessIntelligence: BusinessIntelligenceSchema,
    filteringCriteria: z.object({
      brandedTerms: z.array(z.string()),
      relevantContext: z.array(z.string()),
      genericTerms: z.array(z.string()),
    }),
    analyzedKeywords: z.array(KeywordWithoutScheduleSchema),
  }),
  outputSchema: OutputSchema,
  execute: async ({ inputData }) => {
    const { product, businessIntelligence, analyzedKeywords } = inputData;

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

// Business-oriented keyword discovery workflow - focused on CONVERSIONS, not just rankings
export const keywordIdeasGeneratorWorkflow = createWorkflow({
  id: 'keyword-discovery',
  description: `
    BUSINESS-ORIENTED Keyword Discovery Workflow using ICP, JTBD, and DataForSEO Labs API:
    
    PHILOSOPHY: Drive conversions by targeting keywords that match your Ideal Customer Profile
    and Jobs To Be Done framework. Focus on CAC < LTV, not just traffic.
    
    BUSINESS INTELLIGENCE FRAMEWORK:
    1. ICP Analysis (Ideal Customer Profile):
       - Demographics: who are your buyers?
       - Psychographics: how do they think and behave?
       - Pain points: what problems do they face?
    
    2. JTBD Analysis (Jobs To Be Done):
       - Functional jobs: what tasks are they trying to accomplish?
       - Emotional jobs: how do they want to feel?
       - Social jobs: how do they want to be perceived?
    
    3. Funnel-Aware Keyword Generation:
       - Awareness stage: problem discovery (top of funnel)
       - Consideration stage: solution research (middle of funnel)
       - Decision stage: ready to purchase (bottom of funnel)
    
    4. Value Proposition Mapping:
       - Map keywords to unique differentiators
       - Focus on competitive advantages
    
    5. Negative Keyword Intelligence:
       - Wrong ICP filters (B2B vs B2C, company size, etc.)
       - Wrong intent filters (free-only, DIY, troubleshooting competitors)
       - Competitor brand exclusions
       - Unsupported use case filters
    
    TECHNICAL ENHANCEMENTS (DataForSEO Labs API):
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
    
    WORKFLOW STEPS:
    1. Analyze business with ICP & JTBD framework → extract business intelligence
    2. Generate business-oriented seed keywords (25% pain points, 25% JTBD, 30% funnel-aware, 20% value props)
    3. Fetch existing keywords to avoid duplicates  
    4. Expand via DataForSEO Labs API with premium keyword data + aggressive filtering
    5. AI analysis with strict business potential scoring based on ICP & JTBD fit
    6. Sort by priority score and return exactly 30 unique, high-converting keywords
    
    OUTPUT: 30 unique keywords that will attract buyers who match your ICP, have your target pain points, and show commercial intent (NO duplicates, NO low business potential)
  `,
  inputSchema: ProductInputSchema,
  outputSchema: OutputSchema,
})
  .then(analyzeBusinessContextStep)
  .then(generateSeedKeywordsStep)
  .then(fetchExistingArticlesStep)
  .then(getKeywordDataStep)
  .then(analyzeKeywordsStep)
  .then(finalizeKeywordsStep)
  .commit();

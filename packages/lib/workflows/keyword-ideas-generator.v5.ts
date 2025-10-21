import { createWorkflow, createStep } from '@mastra/core/workflows';
import { Agent } from '@mastra/core/agent';
import { MCPClient } from '@mastra/mcp';
import { z } from 'zod';
import prisma from '@workspace/db/prisma/client';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// ============================================================================
// MCP CLIENT SETUP
// ============================================================================
let dataForSEOMcp: MCPClient | null = null;

function getDataForSEOMcp(): MCPClient {
  if (!dataForSEOMcp) {
    dataForSEOMcp = new MCPClient({
      id: 'keyword-ideas-generator-dataforseo',
      servers: {
        dataforseo: {
          url: new URL('https://mcp.dataforseo.com/mcp'),
          requestInit: {
            headers: {
              Authorization: `Basic ${Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString('base64')}`,
            },
          },
          timeout: 120000, // 120 seconds timeout for DataForSEO API calls
        },
      },
    });
  }
  return dataForSEOMcp;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const TARGET_KEYWORDS_COUNT = 30;
const MIN_SEARCH_VOLUME = 50;

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
  competitorUrls: z.array(z.string()).optional().default([]),
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

const estimateTrafficPotential = (searchVolume: number, ctr = 0.35): number => {
  return Math.round(searchVolume * ctr);
};

// ============================================================================
// AI AGENT WITH DATAFORSEO MCP
// ============================================================================

// Initialize agent with DataForSEO MCP tools (async initialization)
let keywordResearchAgent: Agent | null = null;

async function getKeywordResearchAgent(): Promise<Agent> {
  if (!keywordResearchAgent) {
    const mcp = getDataForSEOMcp();
    const tools = await mcp.getTools();
    keywordResearchAgent = new Agent({
      name: 'Keyword Research Expert',
      instructions: `You are an expert SEO strategist with access to DataForSEO tools.
      
Your role is to conduct comprehensive keyword research that:
- Finds keywords with high search volume and low competition
- Focuses on informational/educational intent (NOT commercial/transactional)
- Avoids duplicate keywords from existing content
- Identifies competitor keyword gaps
- Provides strategic recommendations for content creation

IMPORTANT GUIDELINES:
- Be strategic and efficient with tool calls - each API call can take 30-60 seconds
- Start with broad queries (keyword_ideas) to get many candidates at once
- Use bulk operations (bulk_keyword_difficulty) to process multiple keywords in one call
- Filter and analyze results locally before deciding if you need more data
- Prioritize quality over quantity in your tool usage

Always be thorough, analytical, and strategic in your keyword research.`,
      model: openrouter('anthropic/claude-4.5-sonnet:online'),
      tools,
    });
  }
  return keywordResearchAgent;
}

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
// STEP 2: COMPREHENSIVE AGENT-BASED KEYWORD RESEARCH
// ============================================================================

const agenticKeywordResearchStep = createStep({
  id: 'agentic-keyword-research',
  inputSchema: z.object({
    product: ProductInputSchema,
    existingKeywords: z.array(z.string()),
  }),
  outputSchema: OutputSchema,
  execute: async ({ inputData }) => {
    const { product, existingKeywords } = inputData;
    const agent = await getKeywordResearchAgent();

    console.log(`\n🤖 Starting comprehensive AI-powered keyword research...`);

    const competitorsSection =
      product.competitorUrls && product.competitorUrls.length > 0
        ? `
**COMPETITOR ANALYSIS:**
Analyze these competitor websites to identify keyword gaps:
${product.competitorUrls.map((url, i) => `${i + 1}. ${url}`).join('\n')}

Look for keywords they rank for that we don't, especially with good search volume and manageable difficulty.`
        : '';

    const existingKeywordsSection =
      existingKeywords.length > 0
        ? `
**EXISTING KEYWORDS TO AVOID:**
The following ${existingKeywords.length} keywords are already in use. DO NOT include any of these or close variations:
${existingKeywords.slice(0, 50).join(', ')}${existingKeywords.length > 50 ? '... and more' : ''}`
        : '';

    const prompt = `Conduct advanced keyword research for the customer ${product.url} based on the website analysis.

**BUSINESS CONTEXT:**
- Name: ${product.name}
- Description: ${product.description}
- Target Audiences: ${product.targetAudiences.join(', ')}
- Country: ${product.country}
- Language: ${product.language}

**OBJECTIVE:**
Find exactly ${TARGET_KEYWORDS_COUNT} high-quality keywords for a blog content strategy that meet ALL these criteria:
1. Search volume >= ${MIN_SEARCH_VOLUME}/month
2. Low to medium keyword difficulty (preferably < 50)
3. Informational or navigational search intent (NOT commercial/transactional)
4. Relevant to the target audience
5. NOT targeting product/commercial/buy intent keywords
6. Unique (not duplicating existing content)
${competitorsSection}
${existingKeywordsSection}

**YOUR TASK:**
1. First, identify 3-5 seed keywords based on the business description
2. Use DataForSEO tools strategically (use location_name parameter for country):
   - Use keyword_ideas to get broad keyword suggestions (limit to 100 results)
   - ONLY use keyword_suggestions for 1-2 top seed keywords (limit to 50 per seed) - this endpoint is slow
   - Use bulk_keyword_difficulty to get metrics for all candidates at once
   ${product.competitorUrls && product.competitorUrls.length > 0 ? '- Optionally check competitor rankings if needed for gap analysis' : ''}
3. Filter results to find keywords that match ALL the criteria above
4. Select the best ${TARGET_KEYWORDS_COUNT} keywords prioritizing:
   - High search volume (${MIN_SEARCH_VOLUME}+/month)
   - Low difficulty (< 50 preferred)
   - Informational intent
   - Strong business relevance

**IMPORTANT:** 
- Be efficient with API calls. Each call can take 30-60 seconds.
- Get broad data first (keyword_ideas), then filter locally rather than making many small requests.
- Limit use of keyword_suggestions as it's the slowest endpoint.

**FOR EACH KEYWORD, PROVIDE:**
- keyword: the exact keyword phrase
- searchVolume: monthly search volume
- keywordDifficulty: difficulty score (0-100)
- cpc: cost per click (if available, otherwise 0)
- competition: competition level (0-1, default 0.5 if not available)
- searchIntent: one of "informational", "navigational", "commercial", or "transactional"
- businessPotential: rate 0-3 based on fit for the business:
  * "3" = Perfect fit for target audience
  * "2" = Good fit, relevant
  * "1" = Weak fit, tangentially related
  * "0" = No fit, irrelevant
- parentTopic: main category/topic (e.g., "email marketing", "customer support")
- competitorGap: true if this is a keyword competitors rank for but the business doesn't (and difficulty < 40, volume > 200)
- rationale: one sentence explaining why this keyword is valuable
- recommendedContentType: either "guide" or "listicle"
- recommendedSubtype: if guide: "how_to", "explainer", "comparison", "reference"; if listicle: "round_up", "resources", "examples"
- contentTypeRationale: brief explanation of why this content format will work

Return the analysis in the specified JSON structure with all ${TARGET_KEYWORDS_COUNT} keywords.`;

    try {
      const result = await agent.generateVNext(prompt, {
        maxSteps: 20, // Allow multiple tool calls for comprehensive research
        output: z.object({
          keywords: z.array(
            z.object({
              keyword: z.string(),
              searchVolume: z.number(),
              keywordDifficulty: z.number(),
              cpc: z.number().optional(),
              competition: z.number().optional(),
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

      console.log(
        `✅ Agent completed research with ${result.object.keywords.length} keywords`
      );

      // Enrich keywords with calculated metrics
      const enrichedKeywords = result.object.keywords
        .slice(0, TARGET_KEYWORDS_COUNT)
        .map((kw, index) => {
          const trafficPotential = estimateTrafficPotential(kw.searchVolume);
          const trafficDifficultyRatio =
            kw.searchVolume / Math.max(kw.keywordDifficulty, 1);

          // Calculate priority score
          const bpMultiplier =
            kw.businessPotential === '3'
              ? 1.5
              : kw.businessPotential === '2'
                ? 1.2
                : kw.businessPotential === '1'
                  ? 0.8
                  : 0.5;

          const priorityScore = Math.min(
            Math.round(
              (trafficDifficultyRatio * 0.4 +
                kw.searchVolume * 0.03 +
                (kw.cpc || 0) * 5 +
                (kw.competitorGap ? 20 : 0)) *
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
            keywordDifficulty: kw.keywordDifficulty,
            cpc: kw.cpc || 0,
            competition: kw.competition || 0.5,
            searchIntent: kw.searchIntent,
            businessPotential: kw.businessPotential,
            trafficPotential,
            parentTopic: kw.parentTopic,
            trendScore: undefined,
            competitorGap: kw.competitorGap,
            priorityScore,
            trafficDifficultyRatio,
            rationale: kw.rationale,
            recommendedContentType: kw.recommendedContentType,
            recommendedSubtype: kw.recommendedSubtype,
            contentTypeRationale: kw.contentTypeRationale,
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
      console.error('Failed during agentic keyword research:', error);

      // Check if it's a timeout error
      const errorMessage = String(error);
      if (
        errorMessage.includes('timeout') ||
        errorMessage.includes('timed out')
      ) {
        throw new Error(
          `DataForSEO API timeout: The keyword research took too long. ` +
            `This can happen with large datasets. Try: ` +
            `1) Using fewer seed keywords, 2) Reducing the target keyword count, ` +
            `or 3) Running the workflow again. Original error: ${error}`
        );
      }

      throw new Error(`Agentic keyword research failed: ${error}`);
    }
  },
});

// ============================================================================
// WORKFLOW DEFINITION
// ============================================================================

export const keywordIdeasGeneratorWorkflow = createWorkflow({
  id: 'keyword-ideas-generator',
  description: `
    Agentic Keyword Discovery Workflow using Claude 4.5 Sonnet + DataForSEO MCP:
    
    1. Fetch existing keywords from database to avoid duplicates
    2. Single comprehensive agent call that:
       - Analyzes the business website
       - Uses DataForSEO MCP tools for keyword research
       - Analyzes competitor keywords for gap opportunities
       - Returns 30 unique, strategically selected keywords
    
    OUTPUT: 30 unique keywords with search volume, difficulty, business potential, 
            competitor gaps, and content recommendations
  `,
  inputSchema: ProductInputSchema,
  outputSchema: OutputSchema,
})
  .then(fetchExistingKeywordsStep)
  .then(agenticKeywordResearchStep)
  .commit();

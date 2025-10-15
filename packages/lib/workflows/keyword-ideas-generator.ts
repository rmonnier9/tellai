import { createWorkflow, createStep } from '@mastra/core/workflows';
import { Agent } from '@mastra/core/agent';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import * as DataForSEO from 'dataforseo-client';
import prisma from '@workspace/db/prisma/client';

// Article type schemas
const ArticleTypeEnum = z.enum(['guide', 'listicle']);
const GuideSubtypeEnum = z.enum([
  'how_to',
  'explainer',
  'comparison',
  'reference',
]);
const ListicleSubtypeEnum = z.enum(['round_up', 'resources', 'examples']);

// Article idea schema
const ArticleIdeaSchema = z.object({
  keyword: z.string(),
  title: z.string(),
  type: ArticleTypeEnum,
  guideSubtype: GuideSubtypeEnum.optional(),
  listicleSubtype: ListicleSubtypeEnum.optional(),
  searchVolume: z.number(),
  keywordDifficulty: z.number(),
  cpc: z.number().optional(),
  competition: z.number().optional(),
  scheduledDate: z.string(),
  rationale: z.string(),
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

// Workflow output schema
const OutputSchema = z.object({
  productId: z.string(),
  keywords: z.array(ArticleIdeaSchema),
  totalKeywords: z.number(),
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

// AI Agent for keyword categorization
const keywordCategorizer = new Agent({
  name: 'Keyword Categorizer',
  instructions: `You are an expert SEO content strategist. Your role is to analyze keywords and categorize them into appropriate article types and subtypes. Consider user intent, search patterns, and content effectiveness when making decisions.`,
  model: openai('gpt-4o-mini'),
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

    // Add timestamp-based variation for diversity across runs
    const currentMonth = new Date().toLocaleString('default', {
      month: 'long',
    });
    const currentYear = new Date().getFullYear();

    const languageInstruction = inputData.language
      ? `\n**CRITICAL: ALL keywords MUST be in ${inputData.language.toUpperCase()} language. Do not use English or any other language.**`
      : '';

    const prompt = `Based on this product information, generate 10-15 UNIQUE and DIVERSE seed keywords for SEO article content.

Product Name: ${name}
Description: ${description}
Target Audiences: ${targetAudiences.join(', ')}
Website: ${url}
Language: ${inputData.language || 'en'}
Current Context: ${currentMonth} ${currentYear}
${languageInstruction}

IMPORTANT: Generate fresh, diverse keyword ideas that:
1. Are relevant to the product and its target audiences
2. Cover different aspects and use cases (not just basic features)
3. Include both informational and commercial intent
4. Range from broader topics to specific long-tail queries
5. Consider "how to", comparison, best practices, troubleshooting, and advanced topics
6. Include some timely/current topics relevant to ${currentYear}
7. Explore different angles: beginner guides, expert tips, case studies, alternatives, integrations
8. **MUST be written in ${inputData.language || 'en'} language**

Focus on variety and uniqueness to ensure fresh content ideas.

Provide only the keywords in ${inputData.language || 'en'} language, one per line, without numbering or explanations.`;

    try {
      const result = await keywordCategorizer.generateVNext(prompt, {
        output: z.object({
          keywords: z.array(z.string()).describe('List of seed keywords'),
        }),
      });

      return {
        product: inputData,
        seedKeywords: result.object.keywords,
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

// Step 3: Get keyword ideas from DataForSEO
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
      })
    ),
  }),
  execute: async ({ inputData }) => {
    const { product, seedKeywords, existingKeywords } = inputData;
    const api = getDataForSEOClient();

    console.log(
      `Excluding ${existingKeywords.length} already-used keywords from search`
    );

    try {
      // Create request info for Keywords For Keywords endpoint
      const task =
        new DataForSEO.KeywordsDataGoogleAdsKeywordsForKeywordsLiveRequestInfo();
      task.language_code = product.language || 'en';
      task.location_code = getLocationCode(product.country);
      task.keywords = seedKeywords;
      task.search_partners = false;
      task.include_adult_keywords = false;
      task.sort_by = 'search_volume';

      // Execute the request
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
      }> = [];

      console.log(
        `DataForSEO returned ${taskResult.result?.length || 0} keyword results`
      );

      // Progressive filtering strategy to ensure we get 30 keywords
      // Start with strict filters and progressively relax if needed
      const filterStrategies = [
        { minVolume: 100, maxCompetition: 70, label: 'High quality' },
        { minVolume: 50, maxCompetition: 80, label: 'Medium quality' },
        { minVolume: 10, maxCompetition: 90, label: 'Lower volume' },
        { minVolume: 0, maxCompetition: 100, label: 'Any volume' },
      ];

      if (taskResult.result && taskResult.result.length > 0) {
        for (const strategy of filterStrategies) {
          if (keywordData.length >= 30) break; // We have enough

          for (const item of taskResult.result) {
            if (!item) continue;

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

            // Apply current filter strategy
            if (
              item.search_volume !== null &&
              item.search_volume !== undefined &&
              item.search_volume >= strategy.minVolume &&
              (item.competition_index === null ||
                item.competition_index === undefined ||
                item.competition_index <= strategy.maxCompetition)
            ) {
              const competitionScore =
                item.competition_index !== null &&
                item.competition_index !== undefined
                  ? item.competition_index / 100
                  : 0;

              keywordData.push({
                keyword: item.keyword || '',
                searchVolume: item.search_volume,
                difficulty: item.competition_index || 0,
                cpc: item.cpc || 0,
                competition: competitionScore,
              });
            }
          }

          if (keywordData.length > 0) {
            console.log(
              `${strategy.label}: Found ${keywordData.length} total keywords`
            );
          }
        }
      }

      // If we still don't have 30 keywords, use the original seed keywords
      if (keywordData.length < 30) {
        console.log(
          `Only ${keywordData.length} keywords found from DataForSEO, adding seed keywords to reach 30`
        );

        for (const seedKeyword of seedKeywords) {
          if (keywordData.length >= 30) break;

          // Skip if already used in previous runs
          if (
            existingKeywords.some(
              (existingKw) => existingKw === seedKeyword.toLowerCase()
            )
          ) {
            continue;
          }

          // Skip if already in the list
          if (keywordData.some((kw) => kw.keyword === seedKeyword)) continue;

          // Add seed keyword with estimated values
          keywordData.push({
            keyword: seedKeyword,
            searchVolume: 50, // Estimated
            difficulty: 50, // Estimated medium difficulty
            cpc: 0,
            competition: 0.5,
          });
        }
      }

      // Sort by best difficulty/volume ratio (prioritize high volume, low difficulty)
      keywordData.sort((a, b) => {
        const scoreA = a.searchVolume / Math.max(a.difficulty, 1);
        const scoreB = b.searchVolume / Math.max(b.difficulty, 1);
        return scoreB - scoreA;
      });

      // Take exactly 30 keywords
      const topKeywords = keywordData.slice(0, 30);

      console.log(
        `Final selection: ${topKeywords.length} keywords for content calendar`
      );

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

// Step 3: Categorize keywords into article types and create titles
const categorizeKeywordsStep = createStep({
  id: 'categorize-keywords',
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
      })
    ),
  }),
  outputSchema: z.object({
    product: ProductInputSchema,
    categorizedKeywords: z.array(
      z.object({
        keyword: z.string(),
        searchVolume: z.number(),
        difficulty: z.number(),
        cpc: z.number().optional(),
        competition: z.number().optional(),
        title: z.string(),
        type: ArticleTypeEnum,
        guideSubtype: GuideSubtypeEnum.optional(),
        listicleSubtype: ListicleSubtypeEnum.optional(),
        rationale: z.string(),
      })
    ),
  }),
  execute: async ({ inputData }) => {
    const { product, keywordData } = inputData;

    const languageInstruction = product.language
      ? `\n**CRITICAL: ALL article titles MUST be in ${product.language.toUpperCase()} language. The keywords are already in ${product.language}, keep titles in the same language.**`
      : '';

    const prompt = `You are analyzing keywords for a content calendar. For each keyword, determine:
1. The best article type (guide or listicle)
2. The appropriate subtype - STRICTLY follow these rules:
   
   IF type is "guide", use ONE of these guideSubtype values:
   - how_to: Step-by-step instructions
   - explainer: Educational content explaining concepts
   - comparison: Comparing options or alternatives
   - reference: Comprehensive reference material
   
   IF type is "listicle", use ONE of these listicleSubtype values:
   - round_up: Curated tips, strategies, or advice
   - resources: Tools, software, templates, or websites
   - examples: Case studies or real-world examples

3. A compelling, SEO-optimized article title **IN THE SAME LANGUAGE AS THE KEYWORD (${product.language || 'en'})**
4. Brief rationale for your choices

Product Context:
- Name: ${product.name}
- Description: ${product.description}
- Target Audiences: ${product.targetAudiences.join(', ')}
- Language: ${product.language || 'en'}
${languageInstruction}

Keywords to analyze:
${keywordData.map((kw, i) => `${i + 1}. "${kw.keyword}" (Volume: ${kw.searchVolume}, Difficulty: ${kw.difficulty.toFixed(1)})`).join('\n')}

CRITICAL RULES:
- "How to" queries → type: "guide", guideSubtype: "how_to"
- Comparison keywords (vs, best, comparing) → type: "guide", guideSubtype: "comparison" 
- Questions (what is, why) → type: "guide", guideSubtype: "explainer"
- Definition/reference → type: "guide", guideSubtype: "reference"
- Lists of tips/strategies → type: "listicle", listicleSubtype: "round_up"
- Tool/resource collections → type: "listicle", listicleSubtype: "resources"
- Case studies/examples → type: "listicle", listicleSubtype: "examples"

IMPORTANT: 
- If type is "guide", ONLY use guideSubtype (not listicleSubtype)
- If type is "listicle", ONLY use listicleSubtype (not guideSubtype)
- Never mix guide subtypes with listicle types or vice versa
- **Article titles MUST be in ${product.language || 'en'} language, matching the keyword language**

Provide a categorization for each keyword.`;

    try {
      const result = await keywordCategorizer.generateVNext(prompt, {
        output: z.object({
          categorizations: z.array(
            z.object({
              keyword: z.string(),
              title: z.string(),
              type: ArticleTypeEnum,
              guideSubtype: GuideSubtypeEnum.optional(),
              listicleSubtype: ListicleSubtypeEnum.optional(),
              rationale: z.string(),
            })
          ),
        }),
      });

      const categorizedKeywords = keywordData.map((kw) => {
        const categorization = result.object.categorizations.find(
          (cat) => cat.keyword === kw.keyword
        );

        if (!categorization) {
          // Fallback categorization when AI doesn't provide a response
          return {
            ...kw,
            title: `${kw.keyword.charAt(0).toUpperCase() + kw.keyword.slice(1)} - Complete Guide`,
            type: 'guide' as const,
            guideSubtype: 'explainer' as const,
            listicleSubtype: undefined,
            rationale: 'Default categorization due to missing AI response',
          };
        }

        // Validate and clean up the categorization
        // Ensure guide types don't have listicle subtypes and vice versa
        if (categorization.type === 'guide') {
          return {
            ...kw,
            title: categorization.title,
            type: 'guide' as const,
            guideSubtype: categorization.guideSubtype || 'explainer',
            listicleSubtype: undefined, // Remove any invalid listicle subtype
            rationale: categorization.rationale,
          };
        } else {
          return {
            ...kw,
            title: categorization.title,
            type: 'listicle' as const,
            guideSubtype: undefined, // Remove any invalid guide subtype
            listicleSubtype: categorization.listicleSubtype || 'round_up',
            rationale: categorization.rationale,
          };
        }
      });

      return {
        product,
        categorizedKeywords,
      };
    } catch (error) {
      throw new Error(
        `Failed to categorize keywords: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});

// Step 4: Create 30-day content calendar
const createContentCalendarStep = createStep({
  id: 'create-content-calendar',
  inputSchema: z.object({
    product: ProductInputSchema,
    categorizedKeywords: z.array(
      z.object({
        keyword: z.string(),
        searchVolume: z.number(),
        difficulty: z.number(),
        cpc: z.number().optional(),
        competition: z.number().optional(),
        title: z.string(),
        type: ArticleTypeEnum,
        guideSubtype: GuideSubtypeEnum.optional(),
        listicleSubtype: ListicleSubtypeEnum.optional(),
        rationale: z.string(),
      })
    ),
  }),
  outputSchema: OutputSchema,
  execute: async ({ inputData }) => {
    const { product, categorizedKeywords } = inputData;

    // Ensure we have exactly 30 keywords
    if (categorizedKeywords.length < 30) {
      console.warn(
        `Warning: Only ${categorizedKeywords.length} keywords available, expected 30. Adding fallback ideas.`
      );

      // Language-specific generic topics for fallback
      const genericTopicsMap: Record<string, string[]> = {
        fr: [
          'meilleures pratiques',
          'erreurs courantes à éviter',
          "conseils d'experts",
          'guide pour débutants',
          'techniques avancées',
          'étude de cas',
          'guide de comparaison',
          'liste de vérification',
          'guide de dépannage',
          "stratégies d'optimisation",
        ],
        en: [
          'industry best practices',
          'common mistakes to avoid',
          'expert tips and tricks',
          'beginner-friendly guide',
          'advanced techniques',
          'case study analysis',
          'comparison guide',
          'implementation checklist',
          'troubleshooting guide',
          'optimization strategies',
        ],
        es: [
          'mejores prácticas',
          'errores comunes a evitar',
          'consejos de expertos',
          'guía para principiantes',
          'técnicas avanzadas',
          'análisis de casos',
          'guía de comparación',
          'lista de verificación',
          'guía de solución de problemas',
          'estrategias de optimización',
        ],
        de: [
          'best practices',
          'häufige fehler vermeiden',
          'expertentipps',
          'anfängerfreundlicher leitfaden',
          'fortgeschrittene techniken',
          'fallstudie',
          'vergleichsleitfaden',
          'checkliste',
          'fehlerbehebungsleitfaden',
          'optimierungsstrategien',
        ],
      };

      const lang = product.language || 'en';
      const genericTopics =
        genericTopicsMap[lang] || genericTopicsMap['en'] || [];

      while (categorizedKeywords.length < 30 && genericTopics.length > 0) {
        const topicIndex = categorizedKeywords.length % genericTopics.length;
        const topic = genericTopics[topicIndex] || 'guide';

        categorizedKeywords.push({
          keyword: `${product.name.toLowerCase()} ${topic}`,
          title: `${product.name} ${topic.charAt(0).toUpperCase() + topic.slice(1)}`,
          type: 'guide',
          guideSubtype: 'how_to',
          searchVolume: 50,
          difficulty: 50,
          cpc: 0,
          competition: 0.5,
          rationale: 'Fallback topic to ensure 30 articles',
        });
      }
    }

    // Select exactly 30 keywords (one per day)
    const selectedKeywords = categorizedKeywords.slice(0, 30);

    console.log(
      `Creating 30-day content calendar with ${selectedKeywords.length} articles`
    );

    // Create article ideas with scheduled dates
    const articleIdeas = selectedKeywords.map((kw, index) => {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + index);

      return {
        keyword: kw.keyword,
        title: kw.title,
        type: kw.type,
        guideSubtype: kw.guideSubtype,
        listicleSubtype: kw.listicleSubtype,
        searchVolume: kw.searchVolume,
        keywordDifficulty: kw.difficulty,
        cpc: kw.cpc,
        competition: kw.competition,
        scheduledDate: scheduledDate.toISOString(),
        rationale: kw.rationale,
      };
    });

    return {
      productId: product.id,
      keywords: articleIdeas,
      totalKeywords: articleIdeas.length,
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

// Create the workflow
export const keywordIdeasGeneratorWorkflow = createWorkflow({
  id: 'keyword-ideas-generator',
  description:
    'Generates 30 days of keyword-based article ideas for a product, avoiding duplicates from previous runs',
  inputSchema: ProductInputSchema,
  outputSchema: OutputSchema,
})
  .then(generateSeedKeywordsStep)
  .then(fetchExistingArticlesStep) // Check for existing articles to avoid duplicates
  .then(getKeywordDataStep)
  .then(categorizeKeywordsStep)
  .then(createContentCalendarStep)
  .commit();

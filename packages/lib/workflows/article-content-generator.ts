import { Agent } from '@mastra/core/agent';
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import prisma from '@workspace/db/prisma/client';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { z } from 'zod';
import { generateImage } from '../generate-image';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// DataForSEO API credentials from environment
const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN || '';
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD || '';

// Content generation agent - using a more powerful model for better quality
const contentWriter = new Agent({
  name: 'SEO Content Writer',
  instructions: `You are an expert content writer specializing in SEO-optimized articles that sound natural and human-written. 

Your writing must:
- Sound conversational and authentic, not robotic or formulaic
- Vary sentence structure and length naturally
- Include specific examples, data points, and actionable insights
- Avoid AI clichés like "In today's digital age", "It's important to note", "In conclusion", "Delve into", "Unlock", "Revolutionize"
- Use natural transitions that flow logically
- Write with authority and expertise, but remain approachable
- Include personal insights and nuanced perspectives when appropriate
- Balance informative content with engaging storytelling

Never write content that feels like it came from a template or AI generator.`,
  // model: openai('gpt-4o'),
  model: openrouter('anthropic/claude-sonnet-4.5'),
});

// SERP Analysis agent
const serpAnalyzer = new Agent({
  name: 'SERP Analyzer',
  instructions: `You are an expert SEO analyst who examines top-ranking content to identify patterns, gaps, and opportunities.

Your analysis should:
- Identify the content type and structure that ranks well
- Extract key topics, sections, and content depth
- Find gaps and unanswered questions in competing content
- Identify LSI keywords and semantic variations used
- Analyze technical SEO elements (titles, headers, meta)
- Provide actionable insights for content creation`,
  model: openrouter('anthropic/claude-sonnet-4.5'),
});

// Image strategy agent
const imageStrategist = new Agent({
  name: 'Visual Content Strategist',
  instructions: `You are an expert in visual content strategy for articles. Your role is to identify the best places for images in an article and create concise prompts for AI image generation.

Your analysis should:
- Identify the hero image concept that captures the article's main theme
- Find 2-3 sections where images would enhance understanding
- **CRITICAL**: Distribute images EVENLY throughout the article (beginning, middle, end) - never cluster them in one area
- Analyze ALL section headings before selecting placement
- Select headings from different parts of the article for maximum spacing
- Determine if diagrams would help explain complex concepts
- Create CONCISE, specific prompts (max 30 words) for image generation
- Ensure images add genuine value, not just decoration
- Consider the article's tone, audience, and topic`,
  model: openrouter('anthropic/claude-sonnet-4.5'),
});

// Input schema - now accepts the full data instead of just ID
const inputSchema = z.object({
  articleId: z.string(),
  articleData: z.object({
    keyword: z.string(),
    title: z.string().nullable(),
    type: z.enum(['guide', 'listicle']),
    guideSubtype: z
      .enum(['how_to', 'explainer', 'comparison', 'reference'])
      .nullable(),
    listicleSubtype: z.enum(['round_up', 'resources', 'examples']).nullable(),
    searchVolume: z.number().nullable(),
    keywordDifficulty: z.number().nullable(),
    cpc: z.number().nullable(),
    competition: z.string().nullable(),
  }),
  productData: z.object({
    name: z.string().nullable(),
    description: z.string().nullable(),
    url: z.string(),
    language: z.string().nullable(),
    country: z.string().nullable(),
    targetAudiences: z.array(z.string()),
    bestArticles: z.array(z.string()),
    articleStyle: z.string(),
    internalLinks: z.number(),
    globalInstructions: z.string().nullable(),
    includeYoutubeVideo: z.boolean(),
    includeCallToAction: z.boolean(),
    includeInfographics: z.boolean(),
    includeEmojis: z.boolean(),
    imageStyle: z.string().default('brand-text'),
    brandColor: z.string().default('#000000'),
  }),
});

// Competitive Brief Schema
const competitiveBriefSchema = z.object({
  targetInformation: z.object({
    primaryKeyword: z.string(),
    lsiKeywords: z.array(z.string()),
    searchIntent: z.string(),
  }),
  competitiveAnalysis: z.object({
    targetWordCountMin: z.number(),
    targetWordCountMax: z.number(),
    topPages: z.array(
      z.object({
        url: z.string(),
        title: z.string(),
        wordCount: z.number(),
        mainPoints: z.array(z.string()),
        headings: z.array(z.string()),
      })
    ),
    contentGaps: z.array(z.string()),
    unansweredQuestions: z.array(z.string()),
  }),
  contentStructure: z.object({
    requiredSections: z.array(z.string()),
    keywordPlacements: z.array(z.string()),
    imageSuggestions: z.array(z.string()),
    internalLinkingOpportunities: z.array(z.string()),
  }),
  technicalElements: z.object({
    titleTagGuidelines: z.string(),
    metaDescriptionGuidelines: z.string(),
    schemaMarkupType: z.string(),
    headerHierarchy: z.string(),
  }),
});

// Intermediate schema without images (used by content generation step)
const articleContentSchema = z.object({
  articleId: z.string(),
  title: z.string(),
  content: z.string().describe('Complete article content in markdown format'),
  metaDescription: z
    .string()
    .describe('SEO meta description (150-160 characters)'),
  slug: z.string().describe('URL-friendly slug'),
});

// Output schema (final output with images)
const outputSchema = articleContentSchema.extend({
  images: z
    .array(
      z.object({
        url: z.string().describe('Generated image URL'),
        type: z.enum(['hero', 'section', 'diagram']).describe('Type of image'),
        placement: z
          .string()
          .describe('Where in the article this image should be placed'),
        altText: z.string().describe('SEO-optimized alt text for the image'),
      })
    )
    .describe('Generated images for the article'),
});

// Step 1: Fetch SERP Results from DataForSEO
const fetchSerpResultsStep = createStep({
  id: 'fetch-serp-results',
  inputSchema,
  outputSchema: inputSchema.extend({
    serpResults: z.array(
      z.object({
        position: z.number(),
        url: z.string(),
        title: z.string(),
        description: z.string().optional(),
        html: z.string().optional(),
      })
    ),
  }),
  execute: async ({ inputData }) => {
    const { articleData, productData } = inputData;

    try {
      // Prepare DataForSEO API request
      const requestData = [
        {
          keyword: articleData.keyword,
          location_code: productData.country === 'US' ? 2840 : undefined, // Default to US
          language_code: productData.language || 'en',
          device: 'desktop',
          os: 'windows',
          depth: 10, // Get top 10 results
        },
      ];

      // Make API request to DataForSEO
      const response = await axios.post(
        'https://api.dataforseo.com/v3/serp/google/organic/live/advanced',
        requestData,
        {
          auth: {
            username: DATAFORSEO_LOGIN,
            password: DATAFORSEO_PASSWORD,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (
        !response.data ||
        !response.data.tasks ||
        response.data.tasks.length === 0
      ) {
        throw new Error('No SERP results returned from DataForSEO');
      }

      const task = response.data.tasks[0];
      if (task.status_code !== 20000) {
        throw new Error(
          `DataForSEO API error: ${task.status_message || 'Unknown error'}`
        );
      }

      // Extract organic results (exclude ads)
      const items = task.result?.[0]?.items || [];
      const organicResults = items
        .filter(
          (item: any) => item.type === 'organic' && item.url && item.title
        )
        .slice(0, 3) // Get top 3 organic results
        .map((item: any, index: number) => ({
          position: item.rank_absolute || index + 1,
          url: item.url,
          title: item.title,
          description: item.description || '',
          // Check if DataForSEO provides HTML content
          html: item.html || item.content || undefined,
        }));

      if (organicResults.length === 0) {
        console.warn(
          'No organic results found, proceeding without SERP analysis'
        );
      }

      return {
        ...inputData,
        serpResults: organicResults,
      };
    } catch (error) {
      console.error('Error fetching SERP results:', error);
      // Continue workflow without SERP data rather than failing
      return {
        ...inputData,
        serpResults: [],
      };
    }
  },
});

// Step 2: Fetch existing articles from the same product for internal linking
const fetchExistingArticlesStep = createStep({
  id: 'fetch-existing-articles',
  inputSchema: inputSchema.extend({
    serpResults: z.array(
      z.object({
        position: z.number(),
        url: z.string(),
        title: z.string(),
        description: z.string().optional(),
        html: z.string().optional(),
      })
    ),
  }),
  outputSchema: inputSchema.extend({
    serpResults: z.array(
      z.object({
        position: z.number(),
        url: z.string(),
        title: z.string(),
        description: z.string().optional(),
        html: z.string().optional(),
      })
    ),
    existingArticles: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        keyword: z.string(),
        url: z.string(),
      })
    ),
  }),
  execute: async ({ inputData }) => {
    const { articleId, productData } = inputData;

    try {
      // Fetch existing published articles from the same product
      // Exclude the current article being generated
      const articles = await prisma.article.findMany({
        where: {
          product: {
            url: productData.url,
          },
          status: {
            in: ['published', 'generated'],
          },
          id: {
            not: articleId,
          },
          content: {
            not: null,
          },
        },
        select: {
          id: true,
          title: true,
          keyword: true,
          publications: {
            select: {
              url: true,
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20, // Limit to 20 most recent articles
      });

      // Transform articles into a format suitable for internal linking
      // Only include articles that have been published with a URL
      const existingArticles = articles
        .map((article) => {
          const publishedUrl = article.publications[0]?.url;
          if (!publishedUrl) return null;

          return {
            id: article.id,
            title: article.title || '',
            keyword: article.keyword,
            url: publishedUrl,
          };
        })
        .filter(
          (article): article is NonNullable<typeof article> => article !== null
        );

      console.log(
        `Found ${existingArticles.length} existing articles for internal linking`
      );

      return {
        ...inputData,
        existingArticles,
      };
    } catch (error) {
      console.error('Error fetching existing articles:', error);
      // Continue workflow without existing articles rather than failing
      return {
        ...inputData,
        existingArticles: [],
      };
    }
  },
});

// Step 3: Fetch and Parse Top Competitors' Content
const fetchCompetitorContentStep = createStep({
  id: 'fetch-competitor-content',
  inputSchema: inputSchema.extend({
    serpResults: z.array(
      z.object({
        position: z.number(),
        url: z.string(),
        title: z.string(),
        description: z.string().optional(),
        html: z.string().optional(),
      })
    ),
    existingArticles: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        keyword: z.string(),
        url: z.string(),
      })
    ),
  }),
  outputSchema: inputSchema.extend({
    serpResults: z.array(
      z.object({
        position: z.number(),
        url: z.string(),
        title: z.string(),
        description: z.string().optional(),
        html: z.string().optional(),
      })
    ),
    existingArticles: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        keyword: z.string(),
        url: z.string(),
      })
    ),
    competitorContent: z.array(
      z.object({
        url: z.string(),
        title: z.string(),
        metaDescription: z.string(),
        headings: z.array(z.string()),
        wordCount: z.number(),
        contentPreview: z.string(),
      })
    ),
  }),
  execute: async ({ inputData }) => {
    const { serpResults } = inputData;

    if (!serpResults || serpResults.length === 0) {
      return {
        ...inputData,
        competitorContent: [],
      };
    }

    const competitorContent = [];

    // Fetch and parse each competitor's page
    for (const result of serpResults) {
      try {
        let htmlContent: string | undefined = result.html;

        // If DataForSEO didn't provide HTML, fetch it with axios
        if (!htmlContent) {
          console.log(
            `HTML not available from DataForSEO for ${result.url}, fetching with axios...`
          );

          try {
            const response = await axios.get(result.url, {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              },
              timeout: 10000,
              maxRedirects: 5,
            });
            htmlContent = response.data;
          } catch (axiosError) {
            console.error(
              `Failed to fetch content from ${result.url} with axios:`,
              axiosError instanceof Error ? axiosError.message : 'Unknown error'
            );
            // Continue to next competitor instead of failing
            continue;
          }
        } else {
          console.log(`Using HTML content from DataForSEO for ${result.url}`);
        }

        // Ensure we have HTML content before parsing
        if (!htmlContent) {
          console.error(
            `No HTML content available for ${result.url}, skipping...`
          );
          continue;
        }

        // Parse the HTML content
        const $ = cheerio.load(htmlContent);

        // Remove script, style, and nav elements
        $('script, style, nav, footer, header').remove();

        // Extract headings
        const headings: string[] = [];
        $('h1, h2, h3, h4').each((_, el) => {
          const text = $(el).text().trim();
          if (text) headings.push(text);
        });

        // Extract meta description
        const metaDescription =
          $('meta[name="description"]').attr('content') ||
          $('meta[property="og:description"]').attr('content') ||
          '';

        // Extract main content text
        const bodyText = $('body').text();
        const words = bodyText.split(/\s+/).filter((w) => w.length > 0);
        const wordCount = words.length;

        // Get content preview (first 1000 characters of cleaned text)
        const contentPreview = bodyText
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 1000);

        competitorContent.push({
          url: result.url,
          title: result.title,
          metaDescription,
          headings,
          wordCount,
          contentPreview,
        });
      } catch (error) {
        console.error(
          `Error parsing competitor content from ${result.url}:`,
          error instanceof Error ? error.message : 'Unknown error'
        );
        // Continue with other results - workflow should not fail
      }
    }

    // Log summary
    console.log(
      `Successfully analyzed ${competitorContent.length} out of ${serpResults.length} competitor pages`
    );

    return {
      ...inputData,
      competitorContent,
    };
  },
});

// Step 4: Generate Competitive Analysis Brief
const generateCompetitiveBriefStep = createStep({
  id: 'generate-competitive-brief',
  inputSchema: inputSchema.extend({
    serpResults: z.array(
      z.object({
        position: z.number(),
        url: z.string(),
        title: z.string(),
        description: z.string().optional(),
        html: z.string().optional(),
      })
    ),
    existingArticles: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        keyword: z.string(),
        url: z.string(),
      })
    ),
    competitorContent: z.array(
      z.object({
        url: z.string(),
        title: z.string(),
        metaDescription: z.string(),
        headings: z.array(z.string()),
        wordCount: z.number(),
        contentPreview: z.string(),
      })
    ),
  }),
  outputSchema: inputSchema.extend({
    serpResults: z.any(),
    existingArticles: z.any(),
    competitorContent: z.any(),
    competitiveBrief: competitiveBriefSchema,
  }),
  execute: async ({ inputData }) => {
    const { articleData, competitorContent } = inputData;

    // If no competitor data, generate a basic brief
    if (!competitorContent || competitorContent.length === 0) {
      const basicBrief = {
        targetInformation: {
          primaryKeyword: articleData.keyword,
          lsiKeywords: [],
          searchIntent: 'informational',
        },
        competitiveAnalysis: {
          targetWordCountMin: 1500,
          targetWordCountMax: 2500,
          topPages: [],
          contentGaps: [],
          unansweredQuestions: [],
        },
        contentStructure: {
          requiredSections: [],
          keywordPlacements: [
            'title',
            'introduction',
            'headings',
            'conclusion',
          ],
          imageSuggestions: [],
          internalLinkingOpportunities: [],
        },
        technicalElements: {
          titleTagGuidelines: `Include "${articleData.keyword}" near the beginning, keep under 60 characters`,
          metaDescriptionGuidelines:
            'Write compelling 150-160 character description with keyword',
          schemaMarkupType: 'Article',
          headerHierarchy:
            'Use H1 for title, H2 for main sections, H3 for subsections',
        },
      };

      return {
        ...inputData,
        competitiveBrief: basicBrief,
      };
    }

    // Generate detailed analysis using AI
    const analysisPrompt = `You are analyzing the top-ranking content for the keyword: "${articleData.keyword}"

Your goal is to create an ACTIONABLE competitive brief that will guide content creation to BEAT the competition.

## COMPETITOR DATA

${competitorContent
  .map(
    (comp, idx) => `
### Competitor ${idx + 1} - ${comp.title}
- **URL**: ${comp.url}
- **Meta Description**: ${comp.metaDescription}
- **Word Count**: ${comp.wordCount}
- **Heading Structure** (${comp.headings.length} total):
${comp.headings
  .slice(0, 15)
  .map((h) => `  - ${h}`)
  .join('\n')}
${comp.headings.length > 15 ? `  ... and ${comp.headings.length - 15} more headings` : ''}
- **Content Preview**: ${comp.contentPreview}
`
  )
  .join('\n')}

## YOUR TASK

Create a comprehensive competitive brief that will guide the creation of content that OUTRANKS these competitors.

### 1. Target Information

**Primary Keyword**: Confirm the main keyword being targeted (should be: "${articleData.keyword}")

**LSI Keywords**: Identify 5-10 semantic/LSI keywords that appear across multiple competitors. Look for:
- Variations of the main keyword
- Related terms used in headings
- Technical jargon or terminology
- Common phrases that signal the topic

**Search Intent**: Determine the dominant search intent:
- "informational" - User wants to learn/understand
- "commercial" - User is researching to buy/compare
- "transactional" - User is ready to take action
- "navigational" - User wants to find a specific resource

### 2. Competitive Analysis

**Word Count Analysis**:
- Minimum: [shortest article word count]
- Maximum: [longest article word count]
- Recommended: Aim for 10-20% more than the average

**Top Pages Main Points**: For EACH competitor, identify 3-5 main points/topics they cover.

**Content Gaps**: Identify 3-7 important topics that are MISSING or under-covered:
- What questions aren't fully answered?
- What details are glossed over?
- What perspectives are missing?
- What examples/data are absent?

**Unanswered Questions**: List 3-7 specific questions that users might still have after reading these articles.

### 3. Content Structure (CRITICAL FOR DYNAMIC STRUCTURE)

**Required Sections**: Based on the heading analysis, identify 5-10 ESSENTIAL sections that a comprehensive article MUST include. Extract these from the common patterns in competitor headings. Format as clear section titles (not full sentences).

Examples:
- "Introduction to [Topic]"
- "How [Topic] Works"
- "Benefits and Advantages"
- "Common Challenges"
- "Best Practices"
- "Step-by-Step Guide"
- "Comparison of Options"
- "Pricing and Costs"
- "Tips for Success"

**Keyword Placements**: Specify WHERE the keyword should appear:
- "title" - in the H1
- "introduction" - first paragraph
- "first_h2" - first H2 heading
- "headings" - multiple H2/H3 headings
- "body" - naturally throughout
- "conclusion" - final section
- "meta" - meta description

**Image Suggestions**: Identify 3-5 specific places where images/visuals would add value:
- "Diagram showing [specific concept]"
- "Infographic with [specific data]"
- "Screenshot of [specific example]"
- "Chart comparing [specific items]"

**Internal Linking Opportunities**: Suggest 2-4 types of related content that should be linked:
- "Link to related guide on [topic]"
- "Reference tutorial on [specific skill]"
- "Connect to comparison of [alternatives]"

### 4. Technical Elements

**Title Tag**: Provide specific guidelines:
- "Start with '[keyword]', keep under 60 characters, include benefit/hook"
- Be specific about structure

**Meta Description**: Provide specific guidelines:
- "Include '[keyword]' in first 20 chars, mention [key benefit], add CTA, keep 150-160 chars"
- Be specific about what to include

**Schema Markup**: Choose the most appropriate type:
- "Article" - standard article
- "HowTo" - step-by-step guide
- "FAQPage" - Q&A format
- "Product" - product review/comparison
- "VideoObject" - includes video

**Header Hierarchy**: Describe the structure:
- "H1 for title, 5-7 H2 sections, 2-3 H3 under each H2, avoid H4"
- Be specific about the expected structure

## IMPORTANT GUIDELINES

- Be SPECIFIC and ACTIONABLE in every recommendation
- Base everything on actual patterns in the competitor data
- Identify gaps that represent real opportunities
- Your analysis will DIRECTLY drive the content structure
- The "Required Sections" are CRITICAL - these will become the article outline

Be thorough and specific. This brief will determine the success of the content.`;

    try {
      const result = await serpAnalyzer.generateVNext(analysisPrompt, {
        output: competitiveBriefSchema,
      });

      return {
        ...inputData,
        competitiveBrief: result.object,
      };
    } catch (error) {
      console.error('Error generating competitive brief:', error);
      // Fallback to basic brief
      const fallbackBrief = {
        targetInformation: {
          primaryKeyword: articleData.keyword,
          lsiKeywords: [],
          searchIntent: 'informational',
        },
        competitiveAnalysis: {
          targetWordCountMin: Math.min(
            ...competitorContent.map((c) => c.wordCount)
          ),
          targetWordCountMax: Math.max(
            ...competitorContent.map((c) => c.wordCount)
          ),
          topPages: competitorContent.map((c) => ({
            url: c.url,
            title: c.title,
            wordCount: c.wordCount,
            mainPoints: [],
            headings: c.headings.slice(0, 10),
          })),
          contentGaps: [],
          unansweredQuestions: [],
        },
        contentStructure: {
          requiredSections: [],
          keywordPlacements: [
            'title',
            'introduction',
            'headings',
            'conclusion',
          ],
          imageSuggestions: [],
          internalLinkingOpportunities: [],
        },
        technicalElements: {
          titleTagGuidelines: `Include "${articleData.keyword}" near the beginning, keep under 60 characters`,
          metaDescriptionGuidelines:
            'Write compelling 150-160 character description with keyword',
          schemaMarkupType: 'Article',
          headerHierarchy:
            'Use H1 for title, H2 for main sections, H3 for subsections',
        },
      };

      return {
        ...inputData,
        competitiveBrief: fallbackBrief,
      };
    }
  },
});

// Step 5: Generate article content with AI (now using competitive brief)
const generateContentStep = createStep({
  id: 'generate-content',
  inputSchema: inputSchema.extend({
    serpResults: z.any(),
    existingArticles: z.any(),
    competitorContent: z.any(),
    competitiveBrief: competitiveBriefSchema,
  }),
  outputSchema: articleContentSchema.extend({
    articleData: z.any(),
    productData: z.any(),
  }),
  execute: async ({ inputData }) => {
    const {
      articleId,
      articleData,
      productData,
      competitiveBrief,
      existingArticles,
    } = inputData;

    // Generate dynamic structure guidelines based on competitive analysis
    let structureGuidelines = '';

    // Build structure based on competitive insights
    const hasCompetitiveData =
      competitiveBrief.competitiveAnalysis.topPages.length > 0;

    if (hasCompetitiveData) {
      // Dynamic structure based on actual SERP analysis
      const avgWordCount = Math.round(
        (competitiveBrief.competitiveAnalysis.targetWordCountMin +
          competitiveBrief.competitiveAnalysis.targetWordCountMax) /
          2
      );

      structureGuidelines = `
## ADAPTIVE CONTENT STRUCTURE (Based on SERP Analysis)

**Your article must adapt to the competitive landscape while providing unique value.**

### 1. REQUIRED SECTIONS (From Competitive Analysis)

Based on what's working for top-ranking content, your article MUST include these sections:

${
  competitiveBrief.contentStructure.requiredSections.length > 0
    ? competitiveBrief.contentStructure.requiredSections
        .map((section, idx) => `${idx + 1}. **${section}**`)
        .join('\n')
    : '(No specific sections identified - use standard structure for this content type)'
}

### 2. TARGET LENGTH & DEPTH

- **Target Word Count**: ${competitiveBrief.competitiveAnalysis.targetWordCountMin}-${competitiveBrief.competitiveAnalysis.targetWordCountMax} words (aim for ~${avgWordCount} words)
- **Depth Level**: Match or exceed the detail level of top-ranking content
- **Content Density**: Provide substantial value in each section, not just filler

### 3. COMPETITIVE PATTERNS (What's Working)

Top-ranking pages use these structural patterns:

${competitiveBrief.competitiveAnalysis.topPages
  .map(
    (page, idx) => `
**Pattern ${idx + 1}** (from ${page.title}):
- Main sections: ${page.headings.slice(0, 5).join(' → ')}
- Approach: ${page.mainPoints.slice(0, 3).join('; ') || 'Comprehensive coverage of topic'}
- Word count: ${page.wordCount} words`
  )
  .join('\n')}

**Your structure should:**
- Learn from these patterns but DON'T copy them
- Combine the best aspects of each approach
- Add your own unique organization where it improves clarity

### 4. CONTENT GAPS TO FILL (Your Competitive Advantage)

These important topics are MISSING or UNDER-COVERED in top-ranking content:

${
  competitiveBrief.competitiveAnalysis.contentGaps.length > 0
    ? competitiveBrief.competitiveAnalysis.contentGaps
        .map(
          (gap, idx) =>
            `${idx + 1}. ${gap} - **Include a dedicated section for this**`
        )
        .join('\n')
    : '(No major gaps identified - focus on doing everything better)'
}

### 5. UNANSWERED QUESTIONS (Address These)

Competitors leave these questions unanswered - YOU should answer them:

${
  competitiveBrief.competitiveAnalysis.unansweredQuestions.length > 0
    ? competitiveBrief.competitiveAnalysis.unansweredQuestions
        .map((q, idx) => `${idx + 1}. ${q}`)
        .join('\n')
    : '(No major unanswered questions - ensure comprehensive coverage)'
}

### 6. RECOMMENDED ARTICLE FLOW

Based on competitive analysis and content type (${articleData.type}${articleData.guideSubtype ? ` - ${articleData.guideSubtype}` : ''}${articleData.listicleSubtype ? ` - ${articleData.listicleSubtype}` : ''}), structure your article as:

1. **Introduction** (150-200 words)
   - Hook with the problem/opportunity
   - Preview what you'll cover (including the gaps you'll fill)
   - Set expectations

${
  competitiveBrief.contentStructure.requiredSections.length > 0
    ? competitiveBrief.contentStructure.requiredSections
        .map(
          (section, idx) => `
${idx + 2}. **${section}**
   - Provide comprehensive coverage
   - Include specific examples and data
   - ${idx < competitiveBrief.competitiveAnalysis.contentGaps.length ? `Address gap: ${competitiveBrief.competitiveAnalysis.contentGaps[idx]}` : 'Add unique insights'}`
        )
        .join('\n')
    : `
2-N. **Main Content Sections** (adapt to your specific topic)
   - Follow the structural patterns observed in top-ranking content
   - Ensure each section adds unique value
   - Fill the identified content gaps`
}

FINAL. **Conclusion** (100-150 words)
   - Summarize key takeaways
   - Provide actionable next steps
   - Encourage engagement

### 7. VISUAL CONTENT PLACEMENT

${
  competitiveBrief.contentStructure.imageSuggestions.length > 0
    ? `Suggested image/visual placements:\n${competitiveBrief.contentStructure.imageSuggestions.map((sugg, idx) => `${idx + 1}. ${sugg}`).join('\n')}`
    : 'Include relevant images, diagrams, or visual aids where they enhance understanding'
}

**CRITICAL**: This structure is adaptive based on competitive analysis. If the data suggests a different organization would serve readers better, adapt accordingly. The goal is to create content that BEATS the competition, not just matches it.
`;
    } else {
      // Fallback to content-type-based structure when no competitive data
      structureGuidelines = `
## CONTENT STRUCTURE (Standard for ${articleData.type})

**Note**: Limited competitive data available. Using standard structure for this content type.

`;

      // Add content-type specific structure as fallback
      if (articleData.type === 'guide') {
        switch (articleData.guideSubtype) {
          case 'how_to':
            structureGuidelines += `
This is a HOW-TO GUIDE. Structure your article to provide clear, step-by-step instructions:

1. **Introduction** (150-200 words)
   - Hook the reader with a relatable scenario or problem
   - Explain what they'll learn and why it matters
   - Set expectations for time, difficulty, or prerequisites

2. **Background/Context** (optional, 200-300 words)
   - Provide essential context if needed
   - Define key terms or concepts
   - Explain when/why someone would use this approach

3. **Main Content: Step-by-Step Instructions**
   - Break down into 5-10 clear, actionable steps
   - Each step should have:
     * A clear heading (e.g., "Step 1: Configure Your Settings")
     * Detailed explanation (100-200 words per step)
     * Specific examples, code snippets, or screenshots references
     * Common pitfalls or pro tips
   - Use numbered lists for sequential actions
   - Include visual markers or callouts for important notes

4. **Tips and Best Practices** (200-300 words)
   - Share expert insights beyond the basic steps
   - Address common mistakes to avoid
   - Suggest optimizations or advanced techniques

5. **Conclusion** (100-150 words)
   - Summarize what was accomplished
   - Suggest next steps or related topics
   - Encourage reader action or engagement`;
            break;

          case 'explainer':
            structureGuidelines += `
This is an EXPLAINER GUIDE. Structure your article to educate and clarify:

1. **Introduction** (150-200 words)
   - Present the topic with an engaging hook
   - Explain why understanding this topic matters
   - Preview the key concepts you'll cover

2. **What Is [Topic]?** (300-400 words)
   - Provide a clear, comprehensive definition
   - Break down complex concepts into understandable parts
   - Use analogies or real-world examples
   - Address common misconceptions

3. **How It Works** (400-600 words)
   - Explain the underlying mechanisms or processes
   - Use a logical flow that builds understanding
   - Include diagrams, flowcharts, or visual references
   - Connect concepts to practical applications

4. **Key Components/Aspects** (400-600 words)
   - Break down into 3-5 major components or aspects
   - Explain each thoroughly with examples
   - Show how they interconnect or relate

5. **Real-World Applications** (300-400 words)
   - Provide concrete examples of usage
   - Share case studies or success stories
   - Connect theory to practice

6. **Common Questions and Considerations** (200-300 words)
   - Address frequently asked questions
   - Clarify nuances or edge cases
   - Provide additional resources for deep dives

7. **Conclusion** (100-150 words)
   - Recap the key insights
   - Reinforce the importance or relevance
   - Suggest next steps for learning more`;
            break;

          case 'comparison':
            structureGuidelines += `
This is a COMPARISON GUIDE. Structure your article to help readers make informed decisions:

1. **Introduction** (150-200 words)
   - Present the comparison context and decision challenge
   - Explain who this comparison is for
   - Preview what you're comparing

2. **Overview of Options** (300-400 words)
   - Briefly introduce each option (typically 2-5 options)
   - Provide context about each
   - State the key differentiators upfront

3. **Detailed Comparison** (800-1200 words)
   - Compare across 5-8 key criteria:
     * Features and capabilities
     * Pricing and value
     * Ease of use
     * Performance
     * Support and community
     * Integrations
     * Use cases
   - Use tables or side-by-side comparisons where appropriate
   - Be objective and balanced
   - Include specific examples and data points

4. **Pros and Cons** (400-600 words)
   - Summarize strengths of each option
   - Highlight weaknesses or limitations
   - Be honest and fair

5. **When to Choose Each Option** (300-400 words)
   - Provide clear decision criteria
   - Match options to specific scenarios or user profiles
   - Include real-world examples

6. **Conclusion and Recommendation** (150-200 words)
   - Summarize key findings
   - Offer a nuanced recommendation (not just "one is best")
   - Help readers identify their best fit`;
            break;

          case 'reference':
            structureGuidelines += `
This is a REFERENCE GUIDE. Structure your article as a comprehensive resource:

1. **Introduction** (100-150 words)
   - Explain what this reference covers
   - State who should use it
   - Describe how to navigate the guide

2. **Quick Reference** (optional, 200-300 words)
   - Provide a TL;DR or cheat sheet
   - Include most commonly needed information
   - Use tables or lists for quick scanning

3. **Comprehensive Reference Sections**
   - Organize into logical categories (5-10 major sections)
   - Each section should include:
     * Clear heading and description
     * Detailed specifications, syntax, or parameters
     * Examples of usage
     * Related information or cross-references
   - Use consistent formatting throughout
   - Make it scannable with headers, lists, and tables
   - Include code examples, syntax references, or specifications

4. **Additional Resources** (100-150 words)
   - Link to related documentation
   - Suggest further reading
   - Provide community resources

Make this guide comprehensive, well-organized, and easily searchable.`;
            break;
        }
      } else if (articleData.type === 'listicle') {
        switch (articleData.listicleSubtype) {
          case 'round_up':
            structureGuidelines += `
This is a ROUND-UP LISTICLE. Structure your article to showcase the best options:

1. **Introduction** (150-200 words)
   - Present the topic and why this list matters
   - Explain your selection criteria
   - Set expectations for what's included

2. **Quick Summary** (optional, 100-150 words)
   - Provide a table of contents or quick overview
   - Highlight top picks for different use cases

3. **The List** (Main Content)
   - Include 5-15 items (typically 7-10 works best)
   - Each item should have:
     * **Clear heading with item name/number** (e.g., "1. [Product Name] - Best for [Use Case]")
     * **Overview** (50-100 words): Brief introduction and key benefit
     * **Key Features** (100-150 words): Specific capabilities or highlights
     * **What Makes It Stand Out** (50-100 words): Unique value proposition
     * **Best For** (50 words): Ideal user or scenario
     * **Pricing/Access** (if applicable)
   - Maintain consistent structure across all items
   - Include specific details, not generic descriptions
   - Add personal insights or expert opinions

4. **How to Choose** (200-300 words)
   - Provide decision framework
   - Discuss key factors to consider
   - Help readers narrow down options

5. **Conclusion** (100-150 words)
   - Recap top recommendations
   - Offer final guidance
   - Invite reader engagement`;
            break;

          case 'resources':
            structureGuidelines += `
This is a RESOURCES LISTICLE. Structure your article as a curated collection:

1. **Introduction** (150-200 words)
   - Explain what resources you're sharing
   - State who will benefit from this list
   - Describe how to use these resources

2. **The Resource List** (Main Content)
   - Organize into logical categories (3-6 categories)
   - Within each category, list 3-8 resources
   - For each resource include:
     * **Resource name and link reference**
     * **Description** (50-100 words): What it is and what it offers
     * **Why it's valuable** (50-75 words): Specific benefits or use cases
     * **Type of resource** (e.g., tool, article, course, community)
     * **Access details** (free/paid, requirements)
   - Use consistent formatting
   - Include diverse types of resources
   - Prioritize quality over quantity

3. **How to Make the Most of These Resources** (200-300 words)
   - Provide guidance on using the resources effectively
   - Suggest a learning path or sequence
   - Share tips for maximizing value

4. **Conclusion** (100-150 words)
   - Encourage readers to explore the resources
   - Invite them to share their favorites
   - Mention any resources you're watching for future inclusion`;
            break;

          case 'examples':
            structureGuidelines += `
This is an EXAMPLES LISTICLE. Structure your article to showcase real-world instances:

1. **Introduction** (150-200 words)
   - Explain what examples you're showcasing
   - State what readers will learn from them
   - Preview the key insights or patterns

2. **The Examples** (Main Content)
   - Include 5-12 compelling examples
   - Each example should have:
     * **Clear heading** (e.g., "Example 1: [Company/Person/Case] - [Key Lesson]")
     * **Context** (50-100 words): Background and situation
     * **What They Did** (100-150 words): Specific actions, approach, or strategy
     * **Results/Impact** (50-100 words): Outcomes and metrics if available
     * **Key Takeaway** (50-75 words): What we can learn from this
     * **Why It Works** (optional, 50-75 words): Analysis of success factors
   - Include diverse, representative examples
   - Use specific data and details, not vague descriptions
   - Show variety in approaches or outcomes

3. **Common Patterns and Insights** (300-400 words)
   - Analyze what these examples have in common
   - Identify success factors or best practices
   - Note interesting differences or contrasts
   - Extract actionable lessons

4. **How to Apply These Insights** (200-300 words)
   - Translate examples into practical guidance
   - Provide steps readers can take
   - Address common challenges

5. **Conclusion** (100-150 words)
   - Summarize key lessons
   - Inspire action
   - Encourage readers to share their own examples`;
            break;
        }
      }
    } // Close else block for fallback structure

    // Build comprehensive prompt with competitive brief
    const prompt = `You are writing an SEO-optimized article that must sound completely natural and human-written.

## ARTICLE DETAILS

**Target Keyword**: ${articleData.keyword}
**Article Title**: ${articleData.title || `[Generate an engaging, SEO-optimized title based on the keyword]`}
**Article Type**: ${articleData.type}${articleData.guideSubtype ? ` (${articleData.guideSubtype})` : ''}${articleData.listicleSubtype ? ` (${articleData.listicleSubtype})` : ''}

**SEO Metrics**:
- Search Volume: ${articleData.searchVolume || 'Unknown'}
- Keyword Difficulty: ${articleData.keywordDifficulty || 'Unknown'}
${articleData.cpc ? `- CPC: $${articleData.cpc}` : ''}
${articleData.competition ? `- Competition: ${articleData.competition}` : ''}

## COMPETITIVE ANALYSIS BRIEF

Based on analysis of the top 3 ranking pages for "${articleData.keyword}":

### Target Information
- **Primary Keyword**: ${competitiveBrief.targetInformation.primaryKeyword}
- **Search Intent**: ${competitiveBrief.targetInformation.searchIntent}
${
  competitiveBrief.targetInformation.lsiKeywords.length > 0
    ? `- **LSI Keywords to Include**: ${competitiveBrief.targetInformation.lsiKeywords.join(', ')}`
    : ''
}

### Competitive Insights
- **Target Word Count**: ${competitiveBrief.competitiveAnalysis.targetWordCountMin}-${competitiveBrief.competitiveAnalysis.targetWordCountMax} words
${
  competitiveBrief.competitiveAnalysis.topPages.length > 0
    ? `
**Top Ranking Pages**:
${competitiveBrief.competitiveAnalysis.topPages
  .map(
    (page, idx) => `
${idx + 1}. ${page.title} (${page.wordCount} words)
   URL: ${page.url}
   Key sections: ${page.headings.slice(0, 5).join(', ')}
   ${page.mainPoints.length > 0 ? `Main points: ${page.mainPoints.join('; ')}` : ''}`
  )
  .join('\n')}`
    : ''
}
${
  competitiveBrief.competitiveAnalysis.contentGaps.length > 0
    ? `
**Content Gaps to Fill**:
${competitiveBrief.competitiveAnalysis.contentGaps.map((gap) => `- ${gap}`).join('\n')}`
    : ''
}
${
  competitiveBrief.competitiveAnalysis.unansweredQuestions.length > 0
    ? `
**Unanswered Questions to Address**:
${competitiveBrief.competitiveAnalysis.unansweredQuestions.map((q) => `- ${q}`).join('\n')}`
    : ''
}

### Content Structure Recommendations
${
  competitiveBrief.contentStructure.requiredSections.length > 0
    ? `**Required Sections**: ${competitiveBrief.contentStructure.requiredSections.join(', ')}`
    : ''
}
${
  competitiveBrief.contentStructure.keywordPlacements.length > 0
    ? `**Keyword Placement**: ${competitiveBrief.contentStructure.keywordPlacements.join(', ')}`
    : ''
}
${
  competitiveBrief.contentStructure.imageSuggestions.length > 0
    ? `**Image Suggestions**: ${competitiveBrief.contentStructure.imageSuggestions.join('; ')}`
    : ''
}
${
  competitiveBrief.contentStructure.internalLinkingOpportunities.length > 0
    ? `**Internal Linking**: ${competitiveBrief.contentStructure.internalLinkingOpportunities.join('; ')}`
    : ''
}

### Technical SEO Requirements
- **Title Tag**: ${competitiveBrief.technicalElements.titleTagGuidelines}
- **Meta Description**: ${competitiveBrief.technicalElements.metaDescriptionGuidelines}
- **Schema Markup**: ${competitiveBrief.technicalElements.schemaMarkupType}
- **Header Hierarchy**: ${competitiveBrief.technicalElements.headerHierarchy}

**IMPORTANT**: Use this competitive analysis to inform your content, but DO NOT copy or replicate competitor content. Your article must be original, more comprehensive, and fill the identified gaps while being more valuable to readers.

## PRODUCT/BRAND CONTEXT

**Product/Brand**: ${productData.name || 'Not specified'}
**Description**: ${productData.description || 'Not specified'}
**Website**: ${productData.url}
**Target Audiences**: ${productData.targetAudiences.join(', ')}
**Language**: ${productData.language || 'en'}
**Country**: ${productData.country || 'US'}

## CONTENT PREFERENCES

**Writing Style**: ${productData.articleStyle}
${productData.globalInstructions ? `**Custom Instructions**: ${productData.globalInstructions}` : ''}
${productData.includeEmojis ? '**Emojis**: Use sparingly and naturally where they enhance readability' : '**Emojis**: Do not use emojis'}
${productData.includeYoutubeVideo ? '**Video Placeholder**: Include a section suggesting where a relevant video would enhance the content (use format: [VIDEO: Suggested topic/title for video])' : ''}
${productData.includeCallToAction ? `**Call-to-Action**: Include a natural CTA related to ${productData.name || 'the product'} to the url ${productData.url} near the end` : ''}
${productData.includeInfographics ? '**Infographic Placeholders**: Suggest 1-2 places where infographics would be valuable (use format: [INFOGRAPHIC: Suggested data/concept to visualize])' : ''}
${
  productData.internalLinks > 0 &&
  existingArticles &&
  existingArticles.length > 0
    ? `
**Internal Links**: Include ${productData.internalLinks} internal links to relevant existing articles from your site. Select articles from the list below that are contextually relevant to the section where you add the link.

## AVAILABLE ARTICLES FOR INTERNAL LINKING

${existingArticles
  .map(
    (article: any, idx: number) =>
      `${idx + 1}. **${article.title}** (Keyword: ${article.keyword})
   - URL: ${article.url}`
  )
  .join('\n')}

**Instructions for Internal Links**:
- Choose articles that are genuinely relevant to the topic being discussed
- Use natural anchor text that describes what the reader will find (avoid generic "click here")
- Distribute links throughout the article (not all in one section)
- Use markdown format: [anchor text](URL)
- Use the exact URL provided in the list above
- Only link to articles that add value for the reader - quality over quantity
- Each link should feel natural and helpful, not forced`
    : productData.internalLinks > 0
      ? `**Internal Links**: You wanted to include ${productData.internalLinks} internal links, but no existing published articles are available yet. Skip internal linking for this article.`
      : ''
}
${
  productData.bestArticles && productData.bestArticles.length > 0
    ? `
## REFERENCE ARTICLES

Study these high-performing articles for tone and style inspiration (do NOT copy, but learn from their approach):
${productData.bestArticles.map((url, idx) => `${idx + 1}. ${url}`).join('\n')}`
    : ''
}

## ARTICLE STRUCTURE

${structureGuidelines}

## CRITICAL WRITING RULES

### DO:
✓ Write in a natural, conversational tone that sounds human
✓ Vary sentence length and structure for rhythm (mix short, punchy sentences with longer, flowing ones)
✓ Use specific examples, data points, and concrete details
✓ Include actionable insights and practical takeaways
✓ Write with confidence and authority, but remain approachable
✓ Use subheadings to break up content and improve scannability
✓ Include relevant statistics, research, or expert opinions when appropriate
✓ Make smooth, natural transitions between sections
✓ Write in active voice whenever possible
✓ Include personal insights or nuanced perspectives
✓ Use the target keyword naturally (aim for 1-2% density, but prioritize readability)
✓ Optimize for search intent - understand what users really want to know
✓ Front-load important information in each section
✓ Use formatting (bold, italics, lists, quotes) to enhance readability

### DON'T:
✗ Use AI clichés like: "In today's digital age", "It's important to note", "In conclusion", "Delve into", "Unlock", "Revolutionize", "Game-changing", "Cutting-edge", "Leverage", "Seamless"
✗ Write formulaic introductions or conclusions
✗ Use overly formal or robotic language
✗ Create generic, template-like content
✗ Stuff keywords unnaturally
✗ Use excessive transition phrases (however, moreover, furthermore)
✗ Write fluff or filler content - every sentence should add value
✗ Make vague, generic statements without backing them up
✗ Use marketing speak or promotional language (unless specifically for CTAs)
✗ Create walls of text - break up with formatting

## SEO OPTIMIZATION

- Primary keyword: "${articleData.keyword}"
- Include keyword in:
  * Title (naturally, preferably near the beginning)
  * First paragraph (within first 100 words)
  * At least one H2 heading
  * Throughout content (naturally, not forced)
  * Meta description
  * URL slug

- Use semantic variations and related terms naturally
- Answer the search intent comprehensively
- Structure with proper heading hierarchy (H1 → H2 → H3)
- Aim for depth and thoroughness (based on competition and search intent)
- Include long-tail variations when natural

## OUTPUT FORMAT

Return the article in clean Markdown format with:

1. **Title**: Compelling, SEO-optimized H1 (include keyword)
2. **Content**: Full article following the structure guidelines
3. **Formatting**: Use proper markdown (## for H2, ### for H3, **bold**, *italic*, lists, blockquotes)
4. **Meta Description**: Compelling 150-160 character description for SEO
5. **URL Slug**: Clean, keyword-rich slug (lowercase, hyphens)

## QUALITY CHECKLIST

Before finalizing, ensure:
- [ ] Article sounds natural and human-written
- [ ] Keyword is used naturally throughout
- [ ] Structure matches the article type requirements
- [ ] Content is actionable and valuable
- [ ] No AI clichés or formulaic language
- [ ] Proper heading hierarchy
- [ ] Good readability (varied sentence structure, broken up text)
- [ ] Specific examples and details included
- [ ] Search intent is fully addressed

Now write an exceptional, SEO-optimized article that will rank well and provide genuine value to readers. Make it informative, engaging, and indistinguishable from expert human writing.`;

    try {
      const result = await contentWriter.generateVNext(prompt, {
        output: z.object({
          title: z.string().describe('The final article title (H1)'),
          content: z
            .string()
            .describe(
              'Complete article content in markdown format, including all sections and formatting'
            ),
          metaDescription: z
            .string()
            .describe('SEO meta description, 150-160 characters'),
          slug: z.string().describe('URL-friendly slug'),
        }),
      });

      return {
        articleId,
        title: result.object.title,
        content: result.object.content,
        metaDescription: result.object.metaDescription,
        slug: result.object.slug,
        articleData,
        productData,
      };
    } catch (error) {
      throw new Error(
        `Failed to generate article content: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});

// Step 5: Analyze content and plan image placement
const planImagePlacementStep = createStep({
  id: 'plan-image-placement',
  inputSchema: articleContentSchema.extend({
    articleData: z.any(),
    productData: z.any(),
  }),
  outputSchema: articleContentSchema.extend({
    articleData: z.any(),
    productData: z.any(),
    imagePlan: z.array(
      z.object({
        type: z.enum(['hero', 'section', 'diagram']),
        placement: z.string(),
        prompt: z.string(),
        altText: z.string(),
        styleModifier: z.string().optional(),
      })
    ),
  }),
  execute: async ({ inputData }) => {
    const {
      title,
      content,
      articleId,
      metaDescription,
      slug,
      articleData,
      productData,
    } = inputData;

    const analysisPrompt = `You are analyzing an article to determine the best image placement strategy.

## ARTICLE INFORMATION

**Title**: ${title}
**Keyword**: ${articleData?.keyword || 'Unknown'}
**Type**: ${articleData?.type || 'Unknown'}

**Full Article Content**:
${content}

## YOUR TASK

Create a strategic plan for up to 4 images that will enhance this article:

1. **Hero Image** (Required): The main visual that represents the article's topic
   - Should capture the essence of the entire article
   - Will be displayed prominently at the top
   - Should be eye-catching and relevant

2. **Supporting Images** (2-3 images): Enhance specific sections
   - **CRITICAL**: Distribute images EVENLY throughout the article
   - Look at ALL section headings and choose sections from different parts:
     * One image in the early/beginning sections (first 25% of content)
     * One image in the middle sections (middle 50% of content)
     * One image in the later sections (last 25% of content)
   - Consider diagrams for complex concepts that need explanation
   - Consider illustrative images for examples or key points
   - Don't add images just for decoration - each must add value
   - Don't cluster all images in one area

## IMAGE TYPES

- **hero**: Main article image
- **section**: Illustrative image for a specific section
- **diagram**: Simple diagram to explain a concept (e.g., flowchart, process diagram, comparison chart)

## OUTPUT REQUIREMENTS

For each image, provide:

1. **type**: hero, section, or diagram
2. **placement**: The EXACT heading or section title where this image should appear (e.g., "How It Works", "Benefits", "Step-by-Step Guide"). For hero image, use "hero".
3. **prompt**: A CONCISE, specific prompt for image generation (max 30 words)
   - Focus on the core visual concept only
   - For hero/section images: Main subject and style only (e.g., "Modern workspace with laptop, notebook, and coffee cup, minimalist aesthetic")
   - For diagrams: Core concept only (e.g., "Flowchart showing user registration process with 4 steps")
   - Avoid lengthy descriptions - be direct and specific
4. **altText**: SEO-optimized alt text (concise but descriptive, max 100 characters)
5. **styleModifier**: Additional style instructions (optional, max 10 words)

## GUIDELINES

- Always include 1 hero image
- Include 2-3 additional images only where they add real value
- **DISTRIBUTE EVENLY**: Analyze all headings and choose sections from different parts of the article (beginning, middle, end)
- For technical/educational content, consider diagrams
- Keep prompts CONCISE - shorter prompts (20-30 words) generate better quality images
- Match placement to actual section headings in the article (copy the exact heading text)
- Consider the article's tone and target audience
- Avoid placing multiple images in consecutive sections

## DISTRIBUTION STRATEGY

1. First, list ALL major headings (H2) in the article
2. Divide them into thirds: early, middle, late
3. Select one heading from each third for image placement
4. Ensure maximum spacing between images

Return a JSON array of image plans (1-4 images total).`;

    try {
      const result = await imageStrategist.generateVNext(analysisPrompt, {
        output: z.object({
          images: z
            .array(
              z.object({
                type: z.enum(['hero', 'section', 'diagram']),
                placement: z.string(),
                prompt: z.string(),
                altText: z.string(),
                styleModifier: z.string().optional(),
              })
            )
            .max(4),
        }),
      });

      return {
        articleId,
        title,
        content,
        metaDescription,
        slug,
        articleData,
        productData,
        imagePlan: result.object.images,
      };
    } catch (error) {
      console.error('Error planning image placement:', error);
      // Fallback: just create a hero image
      return {
        articleId,
        title,
        content,
        metaDescription,
        slug,
        articleData,
        productData,
        imagePlan: [
          {
            type: 'hero' as const,
            placement: 'Top of article',
            prompt: `Professional header image representing: ${title}`,
            altText: title,
          },
        ],
      };
    }
  },
});

// Step 6: Generate images using Replicate
const generateImagesStep = createStep({
  id: 'generate-images',
  inputSchema: articleContentSchema.extend({
    articleData: z.any(),
    productData: z.any(),
    imagePlan: z.array(
      z.object({
        type: z.enum(['hero', 'section', 'diagram']),
        placement: z.string(),
        prompt: z.string(),
        altText: z.string(),
        styleModifier: z.string().optional(),
      })
    ),
  }),
  outputSchema,
  execute: async ({ inputData }) => {
    const {
      imagePlan,
      productData,
      articleData,
      articleId,
      title,
      content,
      metaDescription,
      slug,
    } = inputData;

    const imageStyle = productData?.imageStyle || 'brand-text';
    const brandColor = productData?.brandColor || '#000000';

    const generatedImages = [];

    // Generate each image
    for (const plan of imagePlan) {
      try {
        // Build the final prompt - keep it concise
        let finalPrompt = plan.prompt;

        // For non-diagram images, apply minimal style based on preference
        if (plan.type !== 'diagram') {
          // Add minimal style suffix based on imageStyle preference
          switch (imageStyle) {
            case 'brand-text':
              finalPrompt = `${finalPrompt}, professional minimal design`;
              break;
            case 'photographic':
              finalPrompt = `${finalPrompt}, photorealistic`;
              break;
            case 'illustration':
              finalPrompt = `${finalPrompt}, modern illustration`;
              break;
            case 'abstract':
              finalPrompt = `${finalPrompt}, abstract geometric`;
              break;
            case 'minimalist':
              finalPrompt = `${finalPrompt}, minimalist`;
              break;
            default:
              finalPrompt = `${finalPrompt}, professional`;
          }
        } else {
          // For diagrams, keep it simple
          finalPrompt = `Simple diagram: ${finalPrompt}`;
        }

        // Add custom style modifier if provided (keep it short)
        if (plan.styleModifier) {
          finalPrompt = `${finalPrompt}, ${plan.styleModifier}`;
        }

        console.log(
          `Generating ${plan.type} image with prompt (${finalPrompt.split(' ').length} words):`,
          finalPrompt
        );

        // Generate the image and upload to S3
        const imageUrl = await generateImage({
          prompt: finalPrompt,
          aspect_ratio: plan.type === 'hero' ? '16:9' : '1:1',
          s3Path: `articles/${articleId}`,
        });

        generatedImages.push({
          url: imageUrl,
          type: plan.type,
          placement: plan.placement,
          altText: plan.altText,
        });

        console.log(`Successfully generated ${plan.type} image`);
      } catch (error) {
        console.error(`Error generating ${plan.type} image:`, error);
        // Continue with other images even if one fails
      }
    }

    // If no images were generated successfully, create a fallback
    if (generatedImages.length === 0) {
      console.warn(
        'No images generated successfully, skipping image generation'
      );
    }

    return {
      articleId,
      title,
      content,
      metaDescription,
      slug,
      images: generatedImages,
    };
  },
});

// Step 7: Insert images into the article content
const insertImagesIntoContentStep = createStep({
  id: 'insert-images-into-content',
  inputSchema: outputSchema,
  outputSchema,
  execute: async ({ inputData }) => {
    const { articleId, title, content, metaDescription, slug, images } =
      inputData;

    if (!images || images.length === 0) {
      console.log('No images to insert into content');
      return inputData;
    }

    let updatedContent = content;

    // Analyze article structure for distribution logging
    const lines = updatedContent.split('\n');
    const headings = lines
      .map((line, idx) => ({
        line: line.trim(),
        index: idx,
      }))
      .filter((item) => item.line.startsWith('##'))
      .map((item) => ({
        text: item.line.replace(/^#+\s*/, ''),
        index: item.index,
      }));

    console.log(
      `Article has ${headings.length} H2 headings across ${lines.length} lines`
    );
    if (headings.length > 0) {
      console.log('Headings:', headings.map((h) => h.text).join(', '));
    }

    // Sort images: hero first, then others
    const sortedImages = [...images].sort((a, b) => {
      if (a.type === 'hero') return -1;
      if (b.type === 'hero') return 1;
      return 0;
    });

    console.log(
      `Inserting ${sortedImages.length} images with placements:`,
      sortedImages.map((img) => `${img.type}: "${img.placement}"`).join(', ')
    );

    for (const image of sortedImages) {
      const imageMarkdown = `![${image.altText}](${image.url})\n\n`;

      if (image.type === 'hero' || image.placement.toLowerCase() === 'hero') {
        // Insert hero image at the very beginning of the content
        updatedContent = imageMarkdown + updatedContent;
        console.log(`Inserted hero image at top of article`);
      } else {
        // For section images, find the heading that matches the placement
        // Try to match exact heading or heading that contains the placement text
        const lines = updatedContent.split('\n');
        let insertIndex = -1;
        let bestMatch = -1;
        let bestMatchScore = 0;

        // Look for the best matching heading
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (!line) continue;

          const trimmedLine = line.trim();
          // Check if it's a heading (starts with #)
          if (trimmedLine.startsWith('#')) {
            const headingText = trimmedLine.replace(/^#+\s*/, '').toLowerCase();
            const placementText = image.placement.toLowerCase();

            // Exact match
            if (headingText === placementText) {
              insertIndex = i;
              break;
            }

            // Partial match - calculate score
            if (
              headingText.includes(placementText) ||
              placementText.includes(headingText)
            ) {
              const score = Math.max(headingText.length, placementText.length);
              if (score > bestMatchScore) {
                bestMatchScore = score;
                bestMatch = i;
              }
            }
          }
        }

        // Use best match if no exact match found
        if (insertIndex === -1 && bestMatch !== -1) {
          insertIndex = bestMatch;
        }

        if (insertIndex !== -1) {
          // Insert image after the heading (skip any empty lines)
          let insertPosition = insertIndex + 1;
          while (insertPosition < lines.length) {
            const currentLine = lines[insertPosition];
            if (!currentLine || currentLine.trim() === '') {
              insertPosition++;
            } else {
              break;
            }
          }

          lines.splice(insertPosition, 0, '', imageMarkdown.trim());
          updatedContent = lines.join('\n');
          const headingLine = lines[insertIndex];
          console.log(
            `Inserted ${image.type} image after heading: ${headingLine || 'unknown'}`
          );
        } else {
          // If no matching heading found, append at the end of content
          console.warn(
            `Could not find heading matching "${image.placement}", appending image at end`
          );
          updatedContent = `${updatedContent}\n\n${imageMarkdown}`;
        }
      }
    }

    console.log(`Successfully inserted ${images.length} images into content`);

    return {
      articleId,
      title,
      content: updatedContent,
      metaDescription,
      slug,
      images,
    };
  },
});

// Create the workflow
export const articleContentGeneratorWorkflow = createWorkflow({
  id: 'article-content-generator',
  description:
    'Generates SEO-optimized article content with competitive SERP analysis, internal linking, and AI-generated images',
  inputSchema,
  outputSchema,
})
  .then(fetchSerpResultsStep)
  .then(fetchExistingArticlesStep)
  .then(fetchCompetitorContentStep)
  .then(generateCompetitiveBriefStep)
  .then(generateContentStep)
  .then(planImagePlacementStep)
  .then(generateImagesStep)
  .then(insertImagesIntoContentStep)
  .commit();

import { createWorkflow, createStep } from '@mastra/core/workflows';
import { Agent } from '@mastra/core/agent';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';

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
  model: openai('gpt-4o'),
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
    competition: z.number().nullable(),
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
  }),
});

// Output schema
const outputSchema = z.object({
  articleId: z.string(),
  title: z.string(),
  content: z.string().describe('Complete article content in markdown format'),
  metaDescription: z
    .string()
    .describe('SEO meta description (150-160 characters)'),
  slug: z.string().describe('URL-friendly slug'),
});

// Generate article content with AI
const generateContentStep = createStep({
  id: 'generate-content',
  inputSchema,
  outputSchema,
  execute: async ({ inputData }) => {
    const { articleId, articleData, productData } = inputData;

    // Determine article structure based on type and subtype
    let structureGuidelines = '';

    if (articleData.type === 'guide') {
      switch (articleData.guideSubtype) {
        case 'how_to':
          structureGuidelines = `
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
          structureGuidelines = `
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
          structureGuidelines = `
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
          structureGuidelines = `
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
          structureGuidelines = `
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
          structureGuidelines = `
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
          structureGuidelines = `
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

    // Build comprehensive prompt
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
${productData.includeYoutubeVideo ? '**Video Placeholder**: Include a section suggesting where a relevant video would enhance the content (use format: `[VIDEO: Suggested topic/title for video]`)' : ''}
${productData.includeCallToAction ? `**Call-to-Action**: Include a natural CTA related to ${productData.name || 'the product'} near the end` : ''}
${productData.includeInfographics ? '**Infographic Placeholders**: Suggest 1-2 places where infographics would be valuable (use format: `[INFOGRAPHIC: Suggested data/concept to visualize]`)' : ''}
${productData.internalLinks > 0 ? `**Internal Links**: Include ${productData.internalLinks} placeholder internal links in natural context (use format: [link text](INTERNAL_LINK_PLACEHOLDER))` : ''}

${
  productData.bestArticles && productData.bestArticles.length > 0
    ? `## REFERENCE ARTICLES

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
      };
    } catch (error) {
      throw new Error(
        `Failed to generate article content: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});

// Create the workflow
export const articleContentGeneratorWorkflow = createWorkflow({
  id: 'article-content-generator',
  description:
    'Generates SEO-optimized article content from article and product data',
  inputSchema,
  outputSchema,
})
  .then(generateContentStep)
  .commit();

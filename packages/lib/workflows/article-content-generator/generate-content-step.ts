import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { contentWriter } from './agents';
import { WorkflowDTO } from './schemas';
import { generateStructureGuidelines } from './structure-guidelines-helper';

// Step 5: Generate article content with AI (now using competitive brief)
const generateContentStep = createStep({
  id: 'generate-content',
  inputSchema: WorkflowDTO,
  outputSchema: WorkflowDTO,
  execute: async ({ inputData }) => {
    const { article, product, competitiveBrief, existingArticles } = inputData;

    // Generate dynamic structure guidelines based on competitive analysis
    const structureGuidelines = generateStructureGuidelines(
      competitiveBrief!,
      article!
    );

    // Build article type and subtype info
    const articleTypeInfo = article?.type
      ? article.type === 'guide'
        ? article.guideSubtype
          ? `Guide: ${article.guideSubtype
              .split('_')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ')}`
          : 'Guide'
        : article.listicleSubtype
          ? `Listicle: ${article.listicleSubtype
              .split('_')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ')}`
          : 'Listicle'
      : null;

    // Map content length to word count ranges
    const getWordCountRange = (
      contentLength: string | null | undefined
    ): { min: number; max: number } | null => {
      switch (contentLength) {
        case 'short':
          return { min: 1200, max: 1600 };
        case 'medium':
          return { min: 1600, max: 2400 };
        case 'long':
          return { min: 2400, max: 3200 };
        case 'comprehensive':
          return { min: 3200, max: 4200 };
        default:
          return null;
      }
    };

    const contentLengthRange = getWordCountRange(article?.contentLength);
    const targetWordCount = contentLengthRange || { min: 1600, max: 2400 };

    // Build comprehensive prompt with competitive brief
    const prompt = `You are writing an SEO-optimized article that must sound completely natural and human-written.

## ARTICLE DETAILS

**Target Keyword**: ${article?.keyword || 'N/A'}
**Article Title**: ${article?.title || `[Generate an engaging, SEO-optimized title based on the keyword]`}
${articleTypeInfo ? `**Article Type**: ${articleTypeInfo}` : article?.type ? `**Article Type**: ${article?.type}${article?.guideSubtype ? ` (${article?.guideSubtype})` : ''}${article?.listicleSubtype ? ` (${article?.listicleSubtype})` : ''}` : ''}
${
  contentLengthRange
    ? `**Content Length**: ${article?.contentLength || ''} (Target: ${contentLengthRange.min}-${contentLengthRange.max} words)`
    : `**Target Word Count**: ${targetWordCount.min}-${targetWordCount.max} words`
}

**SEO Metrics**:
- Search Volume: ${article?.searchVolume || 'Unknown'}
- Keyword Difficulty: ${article?.keywordDifficulty || 'Unknown'}
${article?.cpc ? `- CPC: $${article?.cpc}` : ''}
${article?.competition ? `- Competition: ${article?.competition}` : ''}

## COMPETITIVE ANALYSIS BRIEF

Based on analysis of the top 3 ranking pages for "${article?.keyword}":

### Target Information
- **Primary Keyword**: ${competitiveBrief?.targetInformation.primaryKeyword}
- **Search Intent**: ${competitiveBrief?.targetInformation.searchIntent}
${
  competitiveBrief?.targetInformation?.lsiKeywords &&
  competitiveBrief?.targetInformation?.lsiKeywords?.length > 0
    ? `- **LSI Keywords to Include**: ${competitiveBrief?.targetInformation?.lsiKeywords?.join(', ')}`
    : ''
}

### Competitive Insights
- **Target Word Count**: ${targetWordCount.min}-${targetWordCount.max} words${contentLengthRange ? ` (${article?.contentLength || ''} content length)` : ''}
${
  competitiveBrief?.competitiveAnalysis?.topPages &&
  competitiveBrief?.competitiveAnalysis?.topPages?.length > 0
    ? `
**Top Ranking Pages**:
${competitiveBrief?.competitiveAnalysis.topPages
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
  competitiveBrief?.competitiveAnalysis?.contentGaps &&
  competitiveBrief?.competitiveAnalysis?.contentGaps?.length > 0
    ? `
**Content Gaps to Fill**:
${competitiveBrief?.competitiveAnalysis?.contentGaps?.map((gap) => `- ${gap}`).join('\n')}`
    : ''
}
${
  competitiveBrief?.competitiveAnalysis?.unansweredQuestions &&
  competitiveBrief?.competitiveAnalysis?.unansweredQuestions?.length > 0
    ? `
**Unanswered Questions to Address**:
${competitiveBrief?.competitiveAnalysis.unansweredQuestions.map((q) => `- ${q}`).join('\n')}`
    : ''
}

### Content Structure Recommendations
${
  competitiveBrief?.contentStructure.requiredSections &&
  competitiveBrief?.contentStructure.requiredSections.length > 0
    ? `**Required Sections**: ${competitiveBrief?.contentStructure.requiredSections.join(', ')}`
    : ''
}
${
  competitiveBrief?.contentStructure.keywordPlacements &&
  competitiveBrief?.contentStructure.keywordPlacements.length > 0
    ? `**Keyword Placement**: ${competitiveBrief?.contentStructure.keywordPlacements.join(', ')}`
    : ''
}
${
  competitiveBrief?.contentStructure.imageSuggestions &&
  competitiveBrief?.contentStructure.imageSuggestions.length > 0
    ? `**Image Suggestions**: ${competitiveBrief?.contentStructure.imageSuggestions.join('; ')}`
    : ''
}
${
  competitiveBrief?.contentStructure.internalLinkingOpportunities &&
  competitiveBrief?.contentStructure.internalLinkingOpportunities.length > 0
    ? `**Internal Linking**: ${competitiveBrief?.contentStructure.internalLinkingOpportunities.join('; ')}`
    : ''
}

### Technical SEO Requirements
- **Title Tag**: ${competitiveBrief?.technicalElements.titleTagGuidelines}
- **Meta Description**: ${competitiveBrief?.technicalElements.metaDescriptionGuidelines}
- **Schema Markup**: ${competitiveBrief?.technicalElements.schemaMarkupType}
- **Header Hierarchy**: ${competitiveBrief?.technicalElements.headerHierarchy}

**IMPORTANT**: Use this competitive analysis to inform your content, but DO NOT copy or replicate competitor content. Your article must be original, more comprehensive, and fill the identified gaps while being more valuable to readers.

## PRODUCT/BRAND CONTEXT

**Product/Brand**: ${product?.name || 'Not specified'}
**Description**: ${product?.description || 'Not specified'}
**Website**: ${product?.url}
**Target Audiences**: ${product?.targetAudiences.join(', ')}
**Language**: ${product?.language || 'en'}
**Country**: ${product?.country || 'US'}

## CONTENT PREFERENCES

**Writing Style**: ${product?.articleStyle}
${product?.globalInstructions ? `**Custom Instructions**: ${product?.globalInstructions}` : ''}
${product?.includeEmojis ? '**Emojis**: Use sparingly and naturally where they enhance readability' : '**Emojis**: Do not use emojis'}
${product?.includeYoutubeVideo ? '**Video Placeholder**: Include a section suggesting where a relevant video would enhance the content (use format: [VIDEO: Suggested topic/title for video])' : ''}
${product?.includeCallToAction ? `**Call-to-Action**: Include a natural CTA related to ${product?.name || 'the product'} to the url ${product?.url} near the end` : ''}
${product?.includeInfographics ? '**Infographic Placeholders**: Suggest 1-2 places where infographics would be valuable (use format: [INFOGRAPHIC: Suggested data/concept to visualize])' : ''}
${
  product?.internalLinks &&
  product?.internalLinks > 0 &&
  existingArticles &&
  existingArticles.length > 0
    ? `
**Internal Links**: Include ${product?.internalLinks} internal links to relevant existing articles from your site. Select articles from the list below that are contextually relevant to the section where you add the link.

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
    : product?.internalLinks && product?.internalLinks > 0
      ? `**Internal Links**: You wanted to include ${product?.internalLinks} internal links, but no existing published articles are available yet. Skip internal linking for this article.`
      : ''
}
${
  product?.bestArticles && product?.bestArticles.length > 0
    ? `
## REFERENCE ARTICLES

Study these high-performing articles for tone and style inspiration (do NOT copy, but learn from their approach):
${product?.bestArticles.map((url, idx) => `${idx + 1}. ${url}`).join('\n')}`
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

- Primary keyword: "${article?.keyword}"
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

Return the article with:

1. **Title**: Compelling, SEO-optimized H1 (include keyword) - returned as a SEPARATE field
2. **Content**: Full article content in clean Markdown format
   - Start directly with the first H2 heading or introduction paragraph
   - Use proper markdown (## for H2, ### for H3, **bold**, *italic*, lists, blockquotes)
   - You may include relevant images WITHIN the article body where appropriate (but NOT at the very beginning)
3. **Meta Description**: Compelling 150-160 character description for SEO
4. **URL Slug**: Clean, keyword-rich slug (lowercase, hyphens)

**CRITICAL**: The content field should contain ONLY the article body. Do NOT include:
- ❌ The article title (H1 with single #) - this is a separate field
- ❌ Any featured/hero image at the start of the content - this is handled separately
- ❌ Any markdown image (![...]) as the very first line
- ✅ START the content with either an H2 heading (##) or a text paragraph
- ✅ The very first character should be either '#' (for H2/H3) or regular text, NEVER '!'

## QUALITY CHECKLIST

Before finalizing, ensure:
- [ ] Article sounds natural and human-written
- [ ] Keyword is used naturally throughout
- [ ] Structure matches the article type requirements${articleTypeInfo ? ` (${articleTypeInfo})` : ''}
- [ ] Word count is within target range (${targetWordCount.min}-${targetWordCount.max} words)${contentLengthRange ? ` - ${article?.contentLength || ''} length` : ''}
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

      // Only add watermark if the product setting allows it (not removeWatermark)
      const shouldAddWatermark = !product?.removeWatermark;
      const watermark = `*Article created using [Lovarank](https://www.lovarank.com/ "Lovarank - The AI agent that grows your organic traffic")*`;

      const contentWithOptionalWatermark = shouldAddWatermark
        ? `${result.object.content}\n\n${watermark}`
        : result.object.content;

      return {
        ...inputData,
        articleContent: {
          title: result.object.title,
          content: contentWithOptionalWatermark,
          metaDescription: result.object.metaDescription,
          slug: result.object.slug,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to generate article content: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});

export default generateContentStep;

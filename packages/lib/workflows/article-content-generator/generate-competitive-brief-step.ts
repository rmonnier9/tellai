import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { CompetitiveBriefSchema, WorkflowDTO } from './schemas';
import { serpAnalyzer } from './agents';

// Step 4: Generate Competitive Analysis Brief
const generateCompetitiveBriefStep = createStep({
  id: 'generate-competitive-brief',
  inputSchema: WorkflowDTO,
  outputSchema: WorkflowDTO,
  execute: async ({ inputData }) => {
    const { article, competitorContent } = inputData;

    // If no competitor data, generate a basic brief
    if (!competitorContent || competitorContent.length === 0) {
      const basicBrief = {
        targetInformation: {
          primaryKeyword: article?.keyword,
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
          titleTagGuidelines: `Include "${article?.keyword}" near the beginning, keep under 60 characters`,
          metaDescriptionGuidelines:
            'Write compelling 150-160 character description with keyword',
          schemaMarkupType: 'Article',
          headerHierarchy:
            'Use H1 for title, H2 for main sections, H3 for subsections',
        },
      };

      return {
        ...inputData,
        competitiveBrief: basicBrief as z.infer<typeof CompetitiveBriefSchema>,
      };
    }

    // Generate detailed analysis using AI
    const analysisPrompt = `You are analyzing the top-ranking content for the keyword: "${article?.keyword}"

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

**Primary Keyword**: Confirm the main keyword being targeted (should be: "${article?.keyword}")

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

    const result = await serpAnalyzer.generateVNext(analysisPrompt, {
      output: CompetitiveBriefSchema,
    });

    return {
      ...inputData,
      competitiveBrief: result.object,
    };
  },
});

export default generateCompetitiveBriefStep;

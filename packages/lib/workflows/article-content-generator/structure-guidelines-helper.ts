import { z } from 'zod';
import { CompetitiveBriefSchema } from './schemas';
import { ArticleSchema } from '../../dtos';

type CompetitiveBrief = z.infer<typeof CompetitiveBriefSchema>;
type ArticleData = {
  keyword: string;
  type: 'guide' | 'listicle';
  guideSubtype?: 'how_to' | 'explainer' | 'comparison' | 'reference' | null;
  listicleSubtype?: 'round_up' | 'resources' | 'examples' | null;
};

export function generateStructureGuidelines(
  competitiveBrief: CompetitiveBrief,
  article: z.infer<typeof ArticleSchema>
): string {
  const hasCompetitiveData =
    competitiveBrief.competitiveAnalysis.topPages.length > 0;

  if (hasCompetitiveData) {
    return generateAdaptiveStructure(competitiveBrief, article);
  } else {
    return generateStandardStructure(article);
  }
}

function generateAdaptiveStructure(
  competitiveBrief: CompetitiveBrief,
  articleData: ArticleData
): string {
  const avgWordCount = Math.round(
    (competitiveBrief.competitiveAnalysis.targetWordCountMin +
      competitiveBrief.competitiveAnalysis.targetWordCountMax) /
      2
  );

  return `
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
}

function generateStandardStructure(articleData: ArticleData): string {
  let guidelines = `
## CONTENT STRUCTURE (Standard for ${articleData.type})

**Note**: Limited competitive data available. Using standard structure for this content type.

`;

  if (articleData.type === 'guide') {
    switch (articleData.guideSubtype) {
      case 'how_to':
        guidelines += getHowToStructure();
        break;
      case 'explainer':
        guidelines += getExplainerStructure();
        break;
      case 'comparison':
        guidelines += getComparisonStructure();
        break;
      case 'reference':
        guidelines += getReferenceStructure();
        break;
    }
  } else if (articleData.type === 'listicle') {
    switch (articleData.listicleSubtype) {
      case 'round_up':
        guidelines += getRoundUpStructure();
        break;
      case 'resources':
        guidelines += getResourcesStructure();
        break;
      case 'examples':
        guidelines += getExamplesStructure();
        break;
    }
  }

  return guidelines;
}

function getHowToStructure(): string {
  return `
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
}

function getExplainerStructure(): string {
  return `
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
}

function getComparisonStructure(): string {
  return `
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
}

function getReferenceStructure(): string {
  return `
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
}

function getRoundUpStructure(): string {
  return `
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
}

function getResourcesStructure(): string {
  return `
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
}

function getExamplesStructure(): string {
  return `
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
}

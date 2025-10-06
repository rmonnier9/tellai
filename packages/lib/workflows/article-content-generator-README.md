# Article Content Generator Workflow

A comprehensive Mastra workflow that generates high-quality, SEO-optimized article content in markdown format that doesn't sound AI-generated.

## Overview

This workflow takes an Article ID from your database and generates complete, publication-ready content that:

- ✅ Matches the article's type and subtype structure
- ✅ Optimizes for the target keyword and search intent
- ✅ Sounds natural and human-written (not AI-generated)
- ✅ Follows SEO best practices
- ✅ Respects product/brand preferences and style guidelines
- ✅ Provides actionable, valuable content for readers

## Features

### Intelligent Content Structure

The workflow automatically structures content based on article type:

#### **Guide Articles**
- **How-To**: Step-by-step instructions with clear actionable steps
- **Explainer**: Comprehensive educational content that clarifies complex topics
- **Comparison**: Balanced side-by-side evaluations to help decision-making
- **Reference**: Comprehensive resource guides with organized information

#### **Listicle Articles**
- **Round-Up**: Curated best-of lists with detailed reviews
- **Resources**: Collections of valuable tools, courses, or materials
- **Examples**: Real-world case studies with analysis and takeaways

### Natural, Human-Like Writing

The workflow is specifically designed to avoid AI clichés and generate content that:

- Uses varied sentence structure and natural rhythm
- Includes specific examples and data points
- Avoids common AI phrases like "In today's digital age", "Unlock", "Revolutionize", etc.
- Incorporates personal insights and nuanced perspectives
- Maintains a conversational yet authoritative tone

### SEO Optimization

- Target keyword integration with natural density (1-2%)
- Semantic variations and related terms
- Proper heading hierarchy (H1 → H2 → H3)
- Meta description generation (150-160 chars)
- URL-friendly slug creation
- Search intent matching

### Product/Brand Customization

Respects all product preferences from the database:

- Custom writing style (informative, conversational, technical, etc.)
- Global instructions for brand voice
- Emoji usage preferences
- Internal linking requirements
- Call-to-action inclusion
- Video and infographic placeholders
- Target audience alignment

## Usage

### Basic Usage

```typescript
import { articleContentGeneratorWorkflow } from './workflows/article-content-generator';

const result = await articleContentGeneratorWorkflow.execute({
  articleId: 'clxxx...',
});

console.log(result.title);           // Generated title
console.log(result.slug);            // URL slug
console.log(result.metaDescription); // Meta description
console.log(result.content);         // Full markdown content
```

### Save to Database

```typescript
import prisma from '@lovarank/db/prisma/client';

const result = await articleContentGeneratorWorkflow.execute({
  articleId: articleId,
});

// Update the article with generated content
await prisma.article.update({
  where: { id: result.articleId },
  data: {
    title: result.title,
    content: result.content,
    status: 'generated',
  },
});
```

### Batch Generation

```typescript
const articleIds = ['id1', 'id2', 'id3'];

for (const articleId of articleIds) {
  try {
    const result = await articleContentGeneratorWorkflow.execute({
      articleId,
    });
    
    await prisma.article.update({
      where: { id: articleId },
      data: {
        title: result.title,
        content: result.content,
        status: 'generated',
      },
    });
    
    console.log(`✓ Generated: ${result.title}`);
  } catch (error) {
    console.error(`✗ Failed: ${articleId}`, error);
  }
}
```

### With Error Handling

```typescript
async function generateWithRetry(articleId: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await articleContentGeneratorWorkflow.execute({ articleId });
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const waitTime = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}
```

## Workflow Steps

### Step 1: Fetch Article Data

Retrieves the article and related product information from the database:

- Article details (keyword, title, type, subtype, SEO metrics)
- Product information (name, description, target audiences)
- Article preferences (style, emojis, CTAs, internal links, etc.)

### Step 2: Generate Content

Uses GPT-4 with a comprehensive prompt to generate:

- Compelling, SEO-optimized title
- Full article content in markdown format
- Meta description for search engines
- URL-friendly slug

The AI agent is specifically instructed to:
- Match the article type and subtype structure
- Write naturally without AI clichés
- Include specific examples and actionable insights
- Optimize for the target keyword and search intent
- Follow all product/brand preferences

## Input Schema

```typescript
{
  articleId: string  // The database ID of the article
}
```

## Output Schema

```typescript
{
  articleId: string,          // Same as input
  title: string,              // Generated SEO-optimized title
  content: string,            // Full markdown content
  metaDescription: string,    // 150-160 char meta description
  slug: string               // URL-friendly slug
}
```

## Content Structure Examples

### How-To Guide Structure

```markdown
# [Title with Keyword]

[Engaging introduction with hook and preview]

## Background/Context
[Essential context if needed]

## Step 1: [Action]
[Detailed instructions with examples]

## Step 2: [Action]
[More instructions]

...

## Tips and Best Practices
[Expert insights]

## Conclusion
[Summary and next steps]
```

### Comparison Guide Structure

```markdown
# [Title comparing options]

[Introduction explaining the comparison]

## Overview of Options
[Brief intro of each option]

## Detailed Comparison

### Feature 1
[Compare across options]

### Feature 2
[Compare across options]

...

## Pros and Cons
[Summary of strengths/weaknesses]

## When to Choose Each Option
[Decision criteria]

## Conclusion
[Recommendations]
```

### Round-Up Listicle Structure

```markdown
# [Title of list]

[Introduction and selection criteria]

## 1. [Option Name] - Best for [Use Case]
[Overview, features, what makes it stand out]

## 2. [Option Name] - Best for [Use Case]
[Overview, features, what makes it stand out]

...

## How to Choose
[Decision framework]

## Conclusion
[Final recommendations]
```

## Content Quality Features

### What the Workflow DOES

✅ Write in natural, conversational tone  
✅ Vary sentence structure for readability  
✅ Include specific examples and data  
✅ Provide actionable insights  
✅ Use formatting effectively (lists, bold, italics)  
✅ Match article type structure requirements  
✅ Optimize for target keyword naturally  
✅ Address search intent comprehensively  
✅ Include expert insights and perspectives  
✅ Create scannable content with good hierarchy  

### What the Workflow AVOIDS

❌ AI clichés ("In today's digital age", "Unlock", etc.)  
❌ Formulaic introductions and conclusions  
❌ Robotic or overly formal language  
❌ Generic template-like content  
❌ Keyword stuffing  
❌ Walls of text without formatting  
❌ Vague statements without backing  
❌ Excessive transition phrases  
❌ Marketing speak (except in CTAs)  

## Customization

### Through Product Settings

Configure article generation preferences in your Product model:

```typescript
{
  articleStyle: "informative" | "conversational" | "technical" | ...,
  globalInstructions: "Custom brand voice instructions",
  includeEmojis: true | false,
  includeYoutubeVideo: true | false,
  includeCallToAction: true | false,
  includeInfographics: true | false,
  internalLinks: number,
  targetAudiences: string[]
}
```

### Through Global Instructions

Set `globalInstructions` on the Product to provide custom guidance:

```typescript
await prisma.product.update({
  where: { id: productId },
  data: {
    globalInstructions: `
      - Write in a friendly, approachable tone
      - Target technical founders and developers
      - Include code examples when relevant
      - Reference our product features naturally
    `
  }
});
```

## Best Practices

### 1. Set Clear Product Preferences

Configure your Product model with:
- Target audiences
- Writing style preferences
- Brand voice guidelines
- Example articles (bestArticles array)

### 2. Provide Good Article Metadata

Ensure your Article has:
- Clear, specific keyword
- Appropriate type and subtype
- SEO metrics if available

### 3. Review and Edit

While the workflow generates high-quality content, always review:
- Factual accuracy
- Brand alignment
- Specific product mentions
- Internal links (replace placeholders)
- Visual content suggestions

### 4. Optimize Internal Links

Replace placeholder internal links with actual URLs:

```typescript
content = content.replace(
  /\[([^\]]+)\]\(INTERNAL_LINK_PLACEHOLDER\)/g,
  (match, linkText) => {
    const url = findRelevantArticle(linkText);
    return `[${linkText}](${url})`;
  }
);
```

### 5. Add Visual Content

Follow the placeholders to add:
- Videos at suggested locations
- Infographics for data visualization
- Screenshots or diagrams where indicated

## Integration Example

Complete workflow integration with error handling and updates:

```typescript
import { articleContentGeneratorWorkflow } from './workflows/article-content-generator';
import prisma from '@lovarank/db/prisma/client';

async function generateAndPublishArticle(articleId: string) {
  try {
    // Generate content
    console.log('Generating content...');
    const result = await articleContentGeneratorWorkflow.execute({
      articleId,
    });
    
    // Process internal links
    const processedContent = await processInternalLinks(result.content);
    
    // Add visual content
    const finalContent = await addVisualContent(processedContent);
    
    // Update database
    await prisma.article.update({
      where: { id: articleId },
      data: {
        title: result.title,
        content: finalContent,
        status: 'generated',
      },
    });
    
    console.log(`✓ Article generated successfully: ${result.title}`);
    console.log(`  Slug: ${result.slug}`);
    console.log(`  Meta: ${result.metaDescription}`);
    console.log(`  Length: ${finalContent.length} characters`);
    
    return result;
    
  } catch (error) {
    console.error('Failed to generate article:', error);
    
    // Update status to failed
    await prisma.article.update({
      where: { id: articleId },
      data: { status: 'failed' },
    });
    
    throw error;
  }
}

async function processInternalLinks(content: string) {
  // Replace INTERNAL_LINK_PLACEHOLDER with actual URLs
  // Implementation depends on your internal link strategy
  return content;
}

async function addVisualContent(content: string) {
  // Process [VIDEO: ...] and [INFOGRAPHIC: ...] placeholders
  // Implementation depends on your media strategy
  return content;
}
```

## Troubleshooting

### Article Not Found Error

```
Error: Article with ID xxx not found
```

**Solution**: Verify the article ID exists in your database.

### Product Not Found Error

```
Error: Product not found for article xxx
```

**Solution**: Ensure the article has a valid `productId` reference.

### Generation Timeout

If generation takes too long or times out:

1. Check your OpenAI API rate limits
2. Consider using `gpt-4o-mini` for faster generation (edit the agent model)
3. Implement retry logic with exponential backoff

### Low Quality Output

If output quality is poor:

1. Improve product `globalInstructions`
2. Add more `bestArticles` for reference
3. Ensure `targetAudiences` are specific
4. Verify article metadata is accurate

## Performance

- **Average generation time**: 30-60 seconds (using GPT-4)
- **Content length**: 1500-3000 words (varies by article type)
- **Cost**: ~$0.10-0.30 per article (OpenAI pricing)

## Future Enhancements

Potential improvements:

- [ ] Competitor analysis integration
- [ ] Automatic fact-checking
- [ ] Image generation integration
- [ ] Multi-language support
- [ ] Custom tone/voice training
- [ ] Real-time SEO scoring
- [ ] Plagiarism detection
- [ ] Readability optimization
- [ ] Schema markup generation

## Related Workflows

- `business-data-extractor`: Extract business data from URLs
- `keyword-ideas-generator`: Generate article keyword ideas

## License

Part of the Lovarank project.


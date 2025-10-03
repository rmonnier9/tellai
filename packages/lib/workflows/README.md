# Workflows

This directory contains Mastra workflows for data extraction and content generation.

## Available Workflows

1. **Business Data Extractor** - Extracts business information from a website URL
2. **Keyword Ideas Generator** - Generates 30 days of SEO-optimized article ideas

---

## Business Data Extractor Workflow

This workflow uses Mastra to extract business information from a website URL. It combines web scraping with AI to provide structured business data.

## Features

- 🌐 **Web Scraping**: Fetches and parses HTML using Cheerio
- 🖼️ **Logo Extraction**: Extracts and converts business logos/favicons to base64
- 🤖 **AI-Powered Analysis**: Uses GPT-4o-mini to extract structured business information
- 📊 **Structured Output**: Returns a well-defined JSON object

## Output Schema

```typescript
{
  url: string,                // Original website URL
  logo: string,               // Base64-encoded business logo or favicon
  name: string,               // Business or product name
  language: string,           // ISO language code (e.g., 'en', 'fr')
  country: string,            // Country code (e.g., 'US', 'UK')
  description: string,        // Detailed description of the business
  targetAudiences: string[]   // List of potential target audience segments
}
```

## How It Works

The workflow consists of 4 steps:

1. **Fetch Page** (`fetch-page`)
   - Fetches the webpage HTML
   - Parses it with Cheerio
   - Extracts metadata (title, description, headings, etc.)

2. **Extract Logo** (`extract-logo`)
   - Finds the business logo or favicon
   - Converts it to base64 format
   - Handles both relative and absolute URLs

3. **Extract Business Info** (`extract-business-info`)
   - Uses AI to analyze the page content
   - Extracts business name, country, description
   - Identifies 3-5 target audience segments

4. **Combine Data** (`combine-data`)
   - Merges all extracted data
   - Returns the final structured output

## Usage

### Basic Usage

```typescript
import { mastra } from '@workspace/lib/mastra';

const result = await mastra.workflows.businessDataExtractorWorkflow.execute({
  triggerData: { url: 'https://example.com' },
});

console.log(result);
```

### Using the Helper Function

```typescript
import { extractBusinessData } from '@workspace/lib/workflows/example-usage';

const data = await extractBusinessData('https://example.com');
console.log(data);
```

### In a Server Action

```typescript
'use server';

import { mastra } from '@workspace/lib/mastra';

export async function getBusinessInfo(url: string) {
  const result = await mastra.workflows.businessDataExtractorWorkflow.execute({
    triggerData: { url },
  });
  
  return result;
}
```

## Example Output

```json
{
  "url": "https://example.com",
  "logo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA...",
  "name": "Example Corp",
  "language": "en",
  "country": "US",
  "description": "Example Corp is a leading provider of cloud-based solutions for small and medium-sized businesses. They specialize in customer relationship management and helpdesk software.",
  "targetAudiences": [
    "Small business owners",
    "Customer support teams",
    "E-commerce retailers",
    "SaaS companies",
    "Help desk managers"
  ]
}
```

## Dependencies

- `axios` - HTTP client for fetching webpages
- `cheerio` - HTML parsing and manipulation
- `@ai-sdk/openai` - OpenAI integration for AI-powered extraction
- `@mastra/core` - Mastra workflow framework

## Environment Variables

Make sure you have the following environment variables set:

```bash
OPENAI_API_KEY=your-openai-api-key
```

## Error Handling

The workflow includes robust error handling:

- Network errors when fetching pages
- Invalid URLs
- Missing or inaccessible logos
- AI extraction failures

All errors are properly caught and logged with descriptive messages.

## Notes

- The workflow respects a 10-second timeout for page fetching
- Logo extraction has a 5-second timeout
- If logo extraction fails, an empty string is returned
- Language codes are normalized to ISO format (e.g., 'en-US' → 'en')
- The AI analyzes page content to infer country codes when not explicitly stated

## Future Improvements

- [ ] Add support for competitor analysis
- [ ] Extract additional SEO metadata
- [ ] Support for multiple languages in target audience detection
- [ ] Cache results to avoid re-fetching the same URLs

---

## Keyword Ideas Generator Workflow

This workflow generates 30 days of SEO-optimized article ideas for a product using the DataForSEO API and AI-powered keyword categorization.

### Features

- 🔍 **Keyword Research**: Uses DataForSEO API to find high-value keywords
- 🤖 **AI Categorization**: Automatically categorizes keywords into article types
- 📅 **Content Calendar**: Creates a 30-day publishing schedule
- 📊 **SEO Metrics**: Includes search volume, difficulty, CPC, and competition data
- 🎯 **Smart Filtering**: Focuses on keywords with optimal difficulty/volume ratio

### Output Schema

```typescript
{
  productId: string,
  articleIdeas: Array<{
    keyword: string,              // Target SEO keyword
    title: string,                // SEO-optimized article title
    type: 'guide' | 'listicle',  // Article type
    guideSubtype?: 'how_to' | 'explainer' | 'comparison' | 'reference',
    listicleSubtype?: 'round_up' | 'resources' | 'examples',
    searchVolume: number,         // Monthly search volume
    keywordDifficulty: number,    // Keyword difficulty (0-100)
    cpc?: number,                 // Cost per click
    competition?: number,         // Competition level (0-1)
    scheduledDate: string,        // ISO date for publishing
    rationale: string             // AI reasoning for categorization
  }>,
  totalIdeas: number
}
```

### Article Types

**Guide Subtypes:**
- `how_to` - Step-by-step instructional content
- `explainer` - Educational content explaining concepts
- `comparison` - Comparative analysis of options
- `reference` - Comprehensive reference material

**Listicle Subtypes:**
- `round_up` - Curated collections of tips, strategies, or advice
- `resources` - Collections of tools, software, templates, or websites
- `examples` - Real-world case studies and success stories

### How It Works

The workflow consists of 4 steps:

1. **Generate Seed Keywords** (`generate-seed-keywords`)
   - Uses AI to generate 10-15 seed keywords based on product info
   - Considers target audiences and product features
   - Covers different intent types (informational, commercial)

2. **Get Keyword Data** (`get-keyword-data`)
   - Fetches keyword metrics from DataForSEO API
   - Gets search volume, difficulty, CPC, competition
   - Filters for keywords with minimum 100 monthly searches
   - Sorts by best difficulty/volume ratio
   - Returns top 50 keywords

3. **Categorize Keywords** (`categorize-keywords`)
   - Uses AI to categorize each keyword into article types
   - Generates SEO-optimized titles
   - Provides rationale for categorization decisions

4. **Create Content Calendar** (`create-content-calendar`)
   - Selects top 30 keywords (one per day)
   - Assigns scheduled dates for the next 30 days
   - Returns complete article ideas with all metadata

### Usage

#### Basic Usage

```typescript
import { keywordIdeasGeneratorWorkflow } from '@workspace/lib/workflows/keyword-ideas-generator';

const result = await keywordIdeasGeneratorWorkflow.execute({
  id: 'product-id',
  name: 'My SaaS Product',
  description: 'A project management tool for remote teams',
  country: 'US',
  language: 'en',
  targetAudiences: ['Remote workers', 'Project managers', 'Startups'],
  url: 'https://example.com'
});

console.log(`Generated ${result.totalIdeas} article ideas`);
```

#### Using the Helper Function

```typescript
import { generateArticleIdeasForProduct } from '@workspace/lib/workflows/keyword-ideas-example';

// Generate ideas and save to database
const result = await generateArticleIdeasForProduct('product-id');

console.log(`Created ${result.articles.length} articles`);
console.log(`Guides: ${result.summary.guides}, Listicles: ${result.summary.listicles}`);
```

#### Generate for Entire Organization

```typescript
import { generateArticleIdeasForOrganization } from '@workspace/lib/workflows/keyword-ideas-example';

const results = await generateArticleIdeasForOrganization('org-id');
console.log(`Generated ideas for ${results.length} products`);
```

#### Get Upcoming Articles

```typescript
import { getUpcomingArticles } from '@workspace/lib/workflows/keyword-ideas-example';

// Get articles scheduled for next 7 days
const upcoming = await getUpcomingArticles('product-id', 7);
console.log(`${upcoming.length} articles coming up`);
```

### Database Schema

The workflow creates records in the `Article` table:

```prisma
model Article {
  id                String           @id @default(cuid())
  productId         String
  keyword           String
  title             String?
  type              ArticleType      // guide | listicle
  guideSubtype      GuideSubtype?
  listicleSubtype   ListicleSubtype?
  searchVolume      Int?
  keywordDifficulty Float?
  cpc               Float?
  competition       Float?
  scheduledDate     DateTime
  status            String           @default("pending")
  content           String?
  publishedUrl      String?
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
}
```

### Environment Variables

Required environment variables:

```bash
# DataForSEO API credentials
DATAFORSEO_LOGIN=your-dataforseo-login
DATAFORSEO_PASSWORD=your-dataforseo-password

# OpenAI API key for AI categorization
OPENAI_API_KEY=your-openai-api-key
```

**Getting DataForSEO Credentials:**
1. Sign up at [DataForSEO](https://dataforseo.com/)
2. Navigate to your dashboard
3. Find your API credentials under Settings
4. Add them to your `.env` file

### Dependencies

- `dataforseo-client` - TypeScript client for DataForSEO API (imported as `import * as DataForSEO from 'dataforseo-client'`)
- `@ai-sdk/openai` - OpenAI integration for AI-powered categorization
- `@mastra/core` - Mastra workflow framework
- `@workspace/db` - Prisma database client

**Note**: The DataForSEO client uses named exports, not a default export. It's imported using `import * as DataForSEO from 'dataforseo-client'` and uses Basic Authentication.

### Installation

```bash
# Install the DataForSEO client
cd packages/lib
pnpm install dataforseo-client

# Run database migration (creates Article table)
cd ../db
pnpm prisma migrate dev --name add-articles
```

### Example Output

```json
{
  "productId": "clxxx123",
  "totalIdeas": 30,
  "articleIdeas": [
    {
      "keyword": "project management for remote teams",
      "title": "The Complete Guide to Project Management for Remote Teams in 2025",
      "type": "guide",
      "guideSubtype": "how_to",
      "searchVolume": 2400,
      "keywordDifficulty": 45.5,
      "cpc": 3.50,
      "competition": 0.42,
      "scheduledDate": "2025-10-04T00:00:00.000Z",
      "rationale": "How-to query with high search volume and manageable difficulty"
    },
    {
      "keyword": "best project management tools",
      "title": "15 Best Project Management Tools for Remote Teams (2025 Comparison)",
      "type": "listicle",
      "listicleSubtype": "resources",
      "searchVolume": 5600,
      "keywordDifficulty": 62.3,
      "cpc": 8.20,
      "competition": 0.68,
      "scheduledDate": "2025-10-05T00:00:00.000Z",
      "rationale": "List-based tool comparison with commercial intent"
    }
  ]
}
```

### Error Handling

The workflow includes comprehensive error handling:

- DataForSEO API errors (rate limits, authentication)
- Invalid product data
- Missing environment variables
- AI categorization failures (with fallback logic)
- Network timeouts

### Best Practices

1. **Run Monthly**: Generate new ideas every month to keep content fresh
2. **Review AI Suggestions**: The AI categorization is a starting point - review and adjust as needed
3. **Monitor Performance**: Track which article types perform best for your audience
4. **Adjust Filters**: Modify search volume/difficulty thresholds based on your domain authority
5. **Use Target Audiences**: Provide specific target audiences for more relevant keywords

### Country & Language Support

The workflow supports multiple countries and languages. Location codes for DataForSEO:

- `US` - United States (2840)
- `GB` - United Kingdom (2826)
- `CA` - Canada (2124)
- `AU` - Australia (2036)
- `DE` - Germany (2276)
- `FR` - France (2250)
- `ES` - Spain (2724)
- And more...

For additional country codes, refer to the [DataForSEO Locations API](https://docs.dataforseo.com/v3/keywords_data/google_ads/locations/).

### Future Improvements

- [ ] Add competitor keyword analysis
- [ ] Support for seasonal content planning
- [ ] Integration with content generation workflow
- [ ] Automatic content gap analysis
- [ ] Multi-language keyword variations
- [ ] Keyword clustering and topic grouping
- [ ] Historical performance tracking

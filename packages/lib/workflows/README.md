# Business Data Extractor Workflow

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


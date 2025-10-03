# Test3 - Keyword Ideas Generator Test Page

This page allows you to test the keyword ideas generator workflow.

## Setup

Before using this page, make sure you have:

1. **Run the database migration:**
   ```bash
   cd packages/db
   pnpm prisma migrate dev --name add-articles
   ```

2. **Set up environment variables:**
   Add these to your `.env` file:
   ```bash
   DATAFORSEO_LOGIN=your-dataforseo-login
   DATAFORSEO_PASSWORD=your-dataforseo-password
   OPENAI_API_KEY=your-openai-key
   ```

3. **Get DataForSEO credentials:**
   - Sign up at https://dataforseo.com/
   - Get your login and password from the dashboard
   - DataForSEO offers a free trial with $1 credit

## Usage

Navigate to `/test3` in your dashboard app.

### Option 1: Test with Existing Product

1. Enter a Product ID from your database
2. Click "Generate Keyword Ideas"
3. The results will be automatically saved to the `Article` table

### Option 2: Test with Manual Data

1. Fill in the product details manually:
   - **Name**: Product name (e.g., "TaskFlow")
   - **Description**: What the product does (e.g., "A project management tool for remote teams")
   - **URL**: Website URL (e.g., "https://example.com")
   - **Country**: Country code (e.g., "US", "GB", "FR")
   - **Language**: Language code (e.g., "en", "fr", "es")
   - **Target Audiences**: Comma-separated list (e.g., "Remote workers, Project managers, Startups")

2. Click "Generate Keyword Ideas"
3. Results will be displayed but NOT saved to database (test mode)

## What Happens

The workflow will:

1. ✨ Generate 10-15 seed keywords based on your product
2. 🔍 Fetch keyword data from DataForSEO API (search volume, difficulty, CPC)
3. 🤖 Use AI to categorize keywords into article types
4. 📅 Create a 30-day content calendar

This typically takes **30-60 seconds**.

## Expected Output

```json
{
  "success": true,
  "productId": "clxxx123",
  "totalIdeas": 30,
  "articleIdeas": [
    {
      "keyword": "project management for remote teams",
      "title": "The Complete Guide to Project Management for Remote Teams",
      "type": "guide",
      "guideSubtype": "how_to",
      "searchVolume": 2400,
      "keywordDifficulty": 45.5,
      "scheduledDate": "2025-10-04T00:00:00.000Z"
    }
    // ... 29 more ideas
  ]
}
```

## Troubleshooting

### "DataForSEO credentials not found"
- Make sure `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD` are set in your `.env` file
- Restart your development server after adding environment variables

### "Product must have name and description"
- Ensure your product has both `name` and `description` fields populated
- Or use Option 2 to provide manual data

### "No data returned from DataForSEO"
- Check your DataForSEO account has available credits
- Verify your credentials are correct
- Check DataForSEO API status

### Workflow takes too long
- This is normal! The workflow makes multiple API calls:
  - OpenAI API for seed keyword generation
  - DataForSEO API for keyword metrics
  - OpenAI API for categorization
- Expected time: 30-60 seconds

## Next Steps

After generating article ideas:

1. Check the database:
   ```bash
   cd packages/db
   pnpm prisma studio
   ```

2. View the generated articles in the `Article` table

3. Build a UI to:
   - View upcoming scheduled articles
   - Edit article titles and keywords
   - Generate article content (future workflow)
   - Publish articles

## Related Files

- **Workflow**: `packages/lib/workflows/keyword-ideas-generator.ts`
- **Helper Functions**: `packages/lib/workflows/keyword-ideas-example.ts`
- **Schema**: `packages/db/prisma/schema.prisma`


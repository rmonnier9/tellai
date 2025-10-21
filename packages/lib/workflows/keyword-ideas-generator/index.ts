import { createWorkflow } from '@mastra/core/workflows';

import {
  WorkflowDTO,
  WorkflowInputSchema,
  WorkflowOutputSchema,
} from './schemas';
import fetchProductDataStep from './fetch-product-data-step';
import generateSeedKeywordsWithAIStep from './generate-seed-keywords-with-ai-step';
import findCustomerWebsiteKeywordsStep from './find-customer-website-keywords-step';
import findCompetitorsKeywordsStep from './find-competitors-keywords-step';
import findKeywordsGapsStep from './find-keywords-gaps-step';
import growSeedKeywordsStep from './grow-seed-keywords-step';
import pickBestKeywordsStep from './pick-best-keywords-step';
import scheduleKeywordsStep from './schedule-keywords-step';

/*
  1. Fetch competitors keywords
  2. Fetch customer keywords
  3. Fetch customer's lovarank keywords
--
  3. Generate seed keywords with keywords_data/google_ads/keywords_for_site/live
  4. Find keywords ideas for customer's website (call /dataforseo_labs/google/keywords_for_site/live)
  6. Filter keywords ideas with AI
  5. (Pass if 30 found already) Expand keywords ideas with /dataforseo_labs/google/keyword_ideas/live
  6. (Pass if 30 found already) Find long tail keywords with /dataforseo_labs/google/keyword_suggestions/live

  8. Filter keywords ideas with AI

*/

// ============================================================================
// WORKFLOW DEFINITION
// ============================================================================

export const keywordIdeasGeneratorWorkflow = createWorkflow({
  id: 'keyword-ideas-generator',
  description: `
    Advanced Keyword Research Workflow with Multi-Step Analysis:
    
    1. Fetch existing keywords from database to avoid duplicates
    2. Analyze the target website to understand business context
    3. Fetch current keyword rankings
    4. Identify and analyze top competitors
    5. Discover keyword opportunities using multiple methods
    6. Filter and prioritize keywords with AI-powered analysis
    7. Generate keyword research report with metrics
    
    OUTPUT: 30 prioritized keywords with search volume, difficulty, and other SEO metrics
  `,
  inputSchema: WorkflowInputSchema,
  outputSchema: WorkflowDTO,
})
  .then(fetchProductDataStep)
  .then(generateSeedKeywordsWithAIStep)
  .then(growSeedKeywordsStep)
  // .then(analyzeWebsiteStep)
  .then(findCustomerWebsiteKeywordsStep)
  .then(findCompetitorsKeywordsStep)
  .then(findKeywordsGapsStep)
  .then(pickBestKeywordsStep)
  .then(scheduleKeywordsStep)
  .commit();

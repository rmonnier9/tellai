import { createWorkflow } from '@mastra/core/workflows';
import { WorkflowDTO, WorkflowInputSchema } from './schemas';
import fetchSerpResultsStep from './fetch-serp-results-step';
import fetchExistingArticlesStep from './fetch-existing-articles-step';
import fetchCompetitorContentStep from './fetch-competitor-content-step';
import generateCompetitiveBriefStep from './generate-competitive-brief-step';
import generateContentStep from './generate-content-step';
import planImagePlacementStep from './plan-image-placement-step';
import generateImagesStep from './generate-images-step';
import insertImagesIntoContentStep from './insert-images-into-content-step';
import fetchArticleStep from './fetch-article-step';

// Create the workflow
export const articleContentGeneratorWorkflow = createWorkflow({
  id: 'article-content-generator',
  description:
    'Generates SEO-optimized article content with competitive SERP analysis, internal linking, and AI-generated images',
  inputSchema: WorkflowInputSchema,
  outputSchema: WorkflowDTO,
})
  .then(fetchArticleStep)
  .then(fetchSerpResultsStep)
  .then(fetchExistingArticlesStep)
  .then(fetchCompetitorContentStep)
  .then(generateCompetitiveBriefStep)
  .then(generateContentStep)
  .then(planImagePlacementStep)
  .then(generateImagesStep)
  .then(insertImagesIntoContentStep)
  .commit();

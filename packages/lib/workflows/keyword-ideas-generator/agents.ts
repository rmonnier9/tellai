import { Agent } from '@mastra/core/agent';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// ============================================================================
// AGENTS
// ============================================================================

export const websiteAnalysisAgent = new Agent({
  name: 'Website Analysis Agent',
  instructions: `You are an expert website analyzer. Your task is to:
  1. Analyze the website content and structure
  2. Identify the main products/services offered
  3. Determine the target audience
  4. Extract key themes and topics
  5. Identify the business niche and industry
  
  Provide a structured analysis that will help with keyword research.`,
  model: openrouter('anthropic/claude-sonnet-4.5:online'),
});

export const competitorAnalysisAgent = new Agent({
  name: 'Competitor Analysis Agent',
  instructions: `You are an expert in competitive analysis. Your task is to:
  1. Analyze competitor keyword rankings
  2. Identify content gaps and opportunities
  3. Find keywords where competitors rank but the target doesn't
  4. Assess keyword difficulty and competitiveness
  5. Prioritize opportunities based on search volume and difficulty
  
  Focus on finding informational/educational keywords suitable for blog content.`,
  model: openrouter('anthropic/claude-sonnet-4.5:online'),
});

export const keywordsFilteringAgent = new Agent({
  name: 'Keywords Filtering Agent',
  instructions: `You are an expert in keywords filtering. Your task is to:
  1. Filter provided keywords and keep only the ones that are relevant to the business and target audience
  2. Return the filtered keywords in a JSON array`,
  model: openrouter('anthropic/claude-sonnet-4.5:online'),
});

export const seedKeywordsAgent = new Agent({
  name: 'Seed Keywords Agent',
  instructions: `You are an SEO expert in seed keywords generation. Your task is to generate seed keywords idea for a given business website and provided informations`,
  model: openrouter('anthropic/claude-sonnet-4.5:online'),
});

export const findKeywordsGapsAgent = new Agent({
  name: 'Find Keywords Gaps Agent',
  instructions: `You are an SEO expert in finding keywords gaps. Your task is to find keywords gaps between a customer website and its competitors in order to find keywords our customer should target to improve its SEO and increase its traffic.`,
  model: openrouter('anthropic/claude-sonnet-4.5:online'),
});

export const keywordsPickerAgent = new Agent({
  name: 'Keywords Picker Agent',
  instructions: `As an SEO expert, you will be provided with a lists of keywords. Your goal is to pick keywords that will help our customer build topical authority in their niche. Keywords must be tailored for informational blog content (how-to, guides, explanations, comparisons, best, top, etc...)`,
  model: openrouter('anthropic/claude-sonnet-4.5:online'),
});

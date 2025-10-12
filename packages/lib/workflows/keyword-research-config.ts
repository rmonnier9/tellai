/**
 * Keyword Research Configuration
 *
 * Centralized configuration for keyword research workflow and related functionality.
 * Adjust these values to customize behavior without modifying core logic.
 */

// ============================================
// WORKFLOW PARAMETERS
// ============================================

export const KEYWORD_CONFIG = {
  // Seed keyword generation
  SEED_KEYWORDS_COUNT: 15, // Number of seed keywords to generate (max 20 for DataForSEO)
  FINAL_KEYWORDS_COUNT: 30, // Target number of final keywords to return

  // DataForSEO API limits
  DATAFORSEO_SEED_LIMIT: 20, // Max seeds per API request
  DATAFORSEO_RESULTS_LIMIT: 1000, // Max keyword ideas to fetch

  // Filtering thresholds
  MIN_SEARCH_VOLUME: 10, // Minimum monthly search volume
  MIN_BUSINESS_POTENTIAL: 2, // Minimum business potential score (0-3)

  // Traffic estimation
  TOP_3_CTR: 0.35, // Average CTR for positions 1-3 (35%)

  // Competitor gap thresholds
  GAP_DIFFICULTY_LOW: 50, // Keywords with KD < 50
  GAP_VOLUME_LOW: 100, // And volume > 100 are gaps
  GAP_DIFFICULTY_MEDIUM: 70, // OR KD < 70
  GAP_VOLUME_MEDIUM: 500, // And volume > 500 are gaps

  // Priority score weights (must sum to ~100 for 0-100 scale)
  PRIORITY_WEIGHTS: {
    TRAFFIC_DIFFICULTY_RATIO: 40, // Max points from traffic/difficulty
    SEARCH_VOLUME: 20, // Max points from volume
    CPC: 15, // Max points from commercial value
    TREND_BONUS: 5, // Bonus for growing keywords
    GAP_BONUS: 10, // Bonus for competitor gaps
    BUSINESS_POTENTIAL_MULTIPLIERS: {
      BP_3: 1.4, // Perfect fit
      BP_2: 1.2, // Good fit
      BP_1: 1.0, // Weak fit
      BP_0: 0.5, // No fit
    },
  },

  // AI Model configuration
  AI_MODEL: 'openai/gpt-4o', // Model for analysis
  AI_MODEL_SEED_GENERATION: 'openai/gpt-4o', // Model for seed keyword generation
};

// ============================================
// CONTENT TYPE CONFIGURATION
// ============================================

/**
 * Valid guide subtypes that match Prisma schema
 */
export const VALID_GUIDE_SUBTYPES = [
  'how_to',
  'explainer',
  'comparison',
  'reference',
] as const;

/**
 * Valid listicle subtypes that match Prisma schema
 */
export const VALID_LISTICLE_SUBTYPES = [
  'round_up',
  'resources',
  'examples',
] as const;

/**
 * All valid content subtypes
 */
export const VALID_SUBTYPES = [
  ...VALID_GUIDE_SUBTYPES,
  ...VALID_LISTICLE_SUBTYPES,
] as const;

// ============================================
// TYPE EXPORTS
// ============================================

export type GuideSubtype = (typeof VALID_GUIDE_SUBTYPES)[number];
export type ListicleSubtype = (typeof VALID_LISTICLE_SUBTYPES)[number];
export type ContentSubtype = (typeof VALID_SUBTYPES)[number];

// ============================================
// CONFIGURATION EXAMPLES
// ============================================

/**
 * Example configurations for different use cases:
 *
 * 1. AGGRESSIVE (more keywords, lower quality bar):
 * ```
 * FINAL_KEYWORDS_COUNT: 50
 * MIN_BUSINESS_POTENTIAL: 1
 * MIN_SEARCH_VOLUME: 5
 * GAP_DIFFICULTY_MEDIUM: 80
 * ```
 *
 * 2. CONSERVATIVE (fewer keywords, high quality):
 * ```
 * FINAL_KEYWORDS_COUNT: 20
 * MIN_BUSINESS_POTENTIAL: 3
 * MIN_SEARCH_VOLUME: 100
 * GAP_DIFFICULTY_LOW: 30
 * ```
 *
 * 3. BALANCED (current default):
 * ```
 * FINAL_KEYWORDS_COUNT: 30
 * MIN_BUSINESS_POTENTIAL: 2
 * MIN_SEARCH_VOLUME: 10
 * GAP_DIFFICULTY_LOW: 50
 * ```
 */

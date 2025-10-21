import { z } from 'zod';
import { createStep } from '@mastra/core/workflows';
import { WorkflowDTO } from './schemas';
import {
  createDataforseoLabsApiClient,
  getLanguageCode,
  getLocationCode,
} from '../../dataforseo';
import * as DataForSEO from 'dataforseo-client';

function isAlreadyRanking(keyword: string, currentKeywords: any[]): boolean {
  return currentKeywords.some(
    (kw) =>
      kw.keyword.toLowerCase() === keyword.toLowerCase() && kw.position <= 20
  );
}

export const filterAndPrioritizeKeywordsStep = createStep({
  id: 'filter-prioritize-keywords',
  inputSchema: WorkflowDTO,
  outputSchema: WorkflowDTO,
  execute: async ({ inputData }) => {
    const {
      product,
      keywordsBlacklist,
      rawKeywordData,
      currentKeywords,
      websiteAnalysis,
      competitors,
    } = inputData;

    // Filter criteria
    console.log(
      `\n🔍 Filtering ${rawKeywordData?.length || 0} raw keywords...`
    );
    console.log(
      `   Existing keywords to exclude: ${keywordsBlacklist?.length || 0}`
    );
    console.log(`   Current ranking keywords: ${currentKeywords?.length || 0}`);

    // Track filtering stats
    const filterStats = {
      noKeyword: 0,
      existingArticle: 0,
      alreadyRanking: 0,
      wrongIntent: 0,
      lowVolume: 0,
    };

    const filtered = rawKeywordData?.filter((kw: any) => {
      const searchVolume = kw.keyword_info?.search_volume || 0;
      const keyword = kw.keyword?.toLowerCase().trim();
      const mainIntent = kw.search_intent_info?.main_intent?.toLowerCase();

      // Skip if no keyword
      if (!keyword || keyword.length <= 2) {
        filterStats.noKeyword++;
        return false;
      }

      // Skip keywords already in database
      if (keywordsBlacklist?.includes(keyword)) {
        filterStats.existingArticle++;
        return false;
      }

      // Skip keywords we already rank well for
      if (
        isAlreadyRanking(
          kw.keyword,
          currentKeywords?.filter((kw) => kw.keyword !== undefined) || []
        )
      ) {
        filterStats.alreadyRanking++;
        return false;
      }

      // Filter by search intent - only informational and commercial keywords
      // If intent is not available, include it (some keywords may not have intent data)
      if (
        mainIntent &&
        mainIntent !== 'informational' &&
        mainIntent !== 'commercial'
      ) {
        filterStats.wrongIntent++;
        return false;
      }

      // Filter rules (relaxed to allow more keywords through)
      if (searchVolume < 50) {
        filterStats.lowVolume++;
        return false;
      }

      return true;
    });

    console.log(`✅ After filtering: ${filtered?.length || 0} keywords remain`);
    console.log(`   Filtered out breakdown:`);
    console.log(`     - No keyword/too short: ${filterStats.noKeyword}`);
    console.log(`     - Already in articles: ${filterStats.existingArticle}`);
    console.log(`     - Already ranking: ${filterStats.alreadyRanking}`);
    console.log(
      `     - Wrong intent (not info/commercial): ${filterStats.wrongIntent}`
    );
    console.log(`     - Low volume (<50): ${filterStats.lowVolume}`);

    if (filtered?.length === 0) {
      console.warn('⚠️ No keywords passed filtering! Check filter criteria:');
      console.warn('   - Minimum search volume: 50 (API + app level)');
      console.warn(
        '   - Search intent: informational or commercial (app level)'
      );
      console.warn('   - Keywords must not be in existing articles');
      console.warn('   - Keywords must not be already ranking (top 20)');
      if (rawKeywordData?.length && rawKeywordData?.length > 0) {
        console.warn('   Sample raw keyword:', {
          keyword: rawKeywordData[0].keyword,
          searchVolume: rawKeywordData?.[0]?.keyword_info?.search_volume,
          hasKeyword: !!rawKeywordData?.[0]?.keyword,
          searchIntent: rawKeywordData?.[0]?.search_intent_info?.main_intent,
        });
      }
    }

    // Get keyword difficulty for filtered keywords
    const client = createDataforseoLabsApiClient();
    const keywords = filtered?.map((kw) => kw.keyword as string).slice(0, 100);

    console.log(
      `\n🔍 Getting difficulty data for ${keywords?.length || 0} keywords...`
    );

    const difficultyData = await client.googleBulkKeywordDifficultyLive([
      new DataForSEO.DataforseoLabsGoogleBulkKeywordDifficultyLiveRequestInfo({
        keywords,
        language_code: getLanguageCode(product?.language!),
        location_code: getLocationCode(product?.country!),
      }),
    ]);

    // Merge difficulty data
    const enrichedKeywords = filtered?.map((kw) => {
      const diffData = difficultyData?.tasks?.[0]?.result?.[0]?.items?.find(
        (d) => d?.keyword === kw.keyword
      );
      return {
        ...kw,
        keyword_difficulty: diffData?.keyword_difficulty || null,
      };
    });

    console.log(
      `\n📈 Enriched ${enrichedKeywords?.length || 0} keywords with difficulty data`
    );
    if (enrichedKeywords?.length && enrichedKeywords?.length > 0) {
      console.log(`Sample enriched keyword:`, {
        keyword: enrichedKeywords?.[0]?.keyword,
        searchVolume: enrichedKeywords?.[0]?.keyword_info?.search_volume,
        difficulty: enrichedKeywords?.[0]?.keyword_difficulty,
        cpc: enrichedKeywords?.[0]?.keyword_info?.cpc,
        competition: enrichedKeywords?.[0]?.keyword_info?.competition_level,
        intent: enrichedKeywords?.[0]?.search_intent_info?.main_intent,
      });
    }

    // If we don't have enough keywords, just return what we have
    if (enrichedKeywords?.length && enrichedKeywords?.length === 0) {
      console.warn(
        '⚠️ No enriched keywords available, skipping prioritization'
      );
      return {
        product,
        keywordsBlacklist,
        websiteAnalysis,
        currentKeywords,
        competitors,
        prioritizedKeywords: [],
      };
    }

    // Use direct mapping instead of agent - much more reliable!
    // Sort by search volume and take top 30
    console.log(
      `\n🎯 Prioritizing ${enrichedKeywords?.length || 0} keywords by search volume...`
    );

    const sortedKeywords = enrichedKeywords
      ?.sort(
        (a: any, b: any) =>
          (b.keyword_info?.search_volume || 0) -
          (a.keyword_info?.search_volume || 0)
      )
      .slice(0, 30);

    const prioritizedKeywords = sortedKeywords?.map((kw: any) => {
      // Determine priority based on difficulty and volume
      let priority: 'high' | 'medium' | 'low' = 'medium';
      const volume = kw.keyword_info?.search_volume || 0;
      const difficulty = kw.keyword_difficulty || 50;

      if (volume > 500 && difficulty < 30) priority = 'high';
      else if (volume < 200 || difficulty > 60) priority = 'low';

      // Determine category based on keyword content
      let category = 'General';
      const keyword = kw.keyword.toLowerCase();
      if (keyword.includes('trésorerie') || keyword.includes('treasury'))
        category = 'Treasury Management';
      else if (
        keyword.includes('comptabilité') ||
        keyword.includes('accounting')
      )
        category = 'Accounting';
      else if (keyword.includes('factur') || keyword.includes('invoice'))
        category = 'Invoicing';
      else if (keyword.includes('financ')) category = 'Financial Management';
      else if (keyword.includes('gestion') || keyword.includes('management'))
        category = 'Business Management';

      return {
        keyword: kw.keyword,
        category,
        priority,
        reasoning: `Search volume: ${volume}/mo, Difficulty: ${difficulty}/100`,
        searchVolume: volume,
        keywordDifficulty: difficulty,
        cpc: kw.keyword_info?.cpc || null,
        competition: kw.keyword_info?.competition_level || null,
        searchIntent: kw.search_intent_info?.main_intent || null,
        trend: kw.keyword_info?.search_volume_trend || null,
      };
    });

    console.log(
      `✅ Prioritized ${prioritizedKeywords?.length || 0} keywords with full metrics`
    );

    /* DISABLED: Agent-based prioritization - was not selecting keywords from provided data
      const strategy = await keywordStrategyAgent.generateVNext(
        `Analyze these keyword opportunities and create a prioritized list for blog content:
  
  Website Analysis:
  ${websiteAnalysis}
  
  Target Audience: ${product.targetAudiences.join(', ')}
  
  Total Keywords Available: ${enrichedKeywords.length}
  
  Keyword Data (showing ${Math.min(50, enrichedKeywords.length)} keywords):
  ${JSON.stringify(
    enrichedKeywords.slice(0, 50).map((kw: any) => ({
      keyword: kw.keyword,
      searchVolume: kw.keyword_info?.search_volume,
      difficulty: kw.keyword_difficulty,
      cpc: kw.keyword_info?.cpc,
      intent: kw.search_intent_info?.main_intent,
      competition: kw.keyword_info?.competition_level,
    })),
    null,
    2
  )}
  
  **TASK:**
  Select the top 30 most valuable keywords for blog content from the list above. Prioritize:
  - Informational/educational keywords (best for blog content)
  - Keywords with good search volume and manageable difficulty
  - Keywords relevant to the target audience
  
  For each keyword, provide:
  1. keyword: the exact keyword string from the data
  2. category: topic category (e.g., "Financial Management", "Cash Flow")
  3. priority: "high", "medium", or "low"
  4. reasoning: brief explanation of why it's valuable
  
  **IMPORTANT:** Return ONLY a valid JSON array with exactly this structure:
  \`\`\`json
  [
    {
      "keyword": "exact keyword from data",
      "category": "Category Name",
      "priority": "high",
      "reasoning": "Why this keyword matters"
    }
  ]
  \`\`\`
  
  Do not include any additional text outside the JSON array.`
      );
      */

    return {
      ...inputData,
      product,
      keywordsBlacklist,
      websiteAnalysis,
      currentKeywords,
      competitors,
      prioritizedKeywords,
    };
  },
});

export default filterAndPrioritizeKeywordsStep;

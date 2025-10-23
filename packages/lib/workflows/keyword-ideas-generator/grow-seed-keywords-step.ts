import { createStep } from '@mastra/core/workflows';
import {
  createDataforseoLabsApiClient,
  getInformationalKeywords,
} from '../../dataforseo';
import * as DataForSEO from 'dataforseo-client';
import { getLanguageCode, getLocationCode } from '../../dataforseo';
import { z } from 'zod';
import { keywordsFilteringAgent } from './agents';
import { DataForSEOLabsKeywordSchema, WorkflowDTO } from './schemas';
import pMap from 'p-map';

export const growSeedKeywordsStep = createStep({
  id: 'grow-seed-keywords',
  inputSchema: WorkflowDTO,
  outputSchema: WorkflowDTO,
  execute: async ({ inputData }) => {
    const { product, seedKeywords } = inputData;

    let relatedKeywordsFiltered: DataForSEO.KeywordDataInfo[] = [];
    let suggestionsKeywordsFiltered: DataForSEO.KeywordDataInfo[] = [];
    let relatedTotalCost = 0;
    let suggestionsTotalCost = 0;

    const filterKeywordsAI = async (keywords: DataForSEO.KeywordDataInfo[]) => {
      // Use AI agent to filter for 30 long tail keywords relevant to blog content
      const filteredKeywordsResponse =
        await keywordsFilteringAgent.generateVNext(
          `Analyze the following keywords and select exactly 30 long tail keywords that are highly relevant for informational blog content.

Business: ${product?.name}
Description: ${product?.description}
Target Audiences: ${product?.targetAudiences.join(', ')}

Focus on keywords that match these content types:
- How-to guides (e.g., "how to...", "ways to...")
- Comparison articles (e.g., "vs", "versus", "compared to", "difference between")
- Listicles (e.g., "best...", "top...", "X ways to...")
- Tutorial content (e.g., "guide to...", "step by step...")
- Problem-solving (e.g., "why...", "what is...", "when to...")

Select long tail keywords (3+ words) that are specific, relevant to the business, and suitable for creating valuable blog content.

Keywords to analyze:
${keywords?.map((item) => item.keyword).join('\n')}

Return exactly 30 keywords in JSON format.`,
          {
            structuredOutput: {
              schema: z.object({
                keywords: z.array(z.string()).length(30),
              }),
            },
          }
        );

      const filteredKeywords = filteredKeywordsResponse?.object?.keywords || [];
      console.log(
        `Selected ${filteredKeywords.length} long tail keywords for blog content`
      );

      return keywords.filter((item) =>
        filteredKeywords.includes(item.keyword?.toLowerCase() || '')
      );
    };

    const clientLabs = createDataforseoLabsApiClient();

    const informationalWords =
      getInformationalKeywords(product?.language || '') || [];

    const keywordsIdeasResponse = await clientLabs.googleKeywordIdeasLive([
      new DataForSEO.DataforseoLabsGoogleKeywordIdeasLiveRequestInfo({
        keywords: seedKeywords?.slice(0, 5) || [],
        language_code: getLanguageCode(product?.language || ''),
        location_code: getLocationCode(product?.country || ''),
        limit: 500,
        filters: [
          ['search_intent_info.main_intent', '=', 'informational'],
          'and',
          ['keyword_info.search_volume', '>', 30],
          'and',
          [
            'keyword_info.competition_level',
            'in',
            [
              'LOW',
              'MEDIUM',
              // "HIGH"
            ],
          ],
          ...(inputData.keywordsBlacklist?.length
            ? ['and', ['keyword', 'not_in', inputData.keywordsBlacklist]]
            : []),
          ...(informationalWords.length
            ? ['and', ['keyword', 'regex', `(${informationalWords.join('|')})`]]
            : []),
        ],
      }),
    ]);

    const allKeywordsIdeas =
      keywordsIdeasResponse?.tasks?.[0]?.result?.[0]?.items?.filter(
        (item) => !!item
      ) || [];

    const filteredKeywordsIdeas = await filterKeywordsAI(allKeywordsIdeas);

    // Call googleKeywordSuggestionsLive for each seed keyword with concurrency
    const relatedResponse = await pMap(
      seedKeywords || [],
      async (seedKeyword) => {
        console.log(`Fetching keyword suggestions for: ${seedKeyword}`);

        const task = await clientLabs.googleRelatedKeywordsLive([
          new DataForSEO.DataforseoLabsGoogleRelatedKeywordsLiveRequestInfo({
            keyword: seedKeyword,
            language_code: getLanguageCode(product?.language || ''),
            location_code: getLocationCode(product?.country || ''),
            include_serp_info: false,
            depth: 2,
            limit: 100,
            filters: [
              [
                'keyword_data.search_intent_info.main_intent',
                '=',
                'informational',
              ],
              'and',
              ['keyword_data.keyword_info.search_volume', '>', 10],
              'and',
              [
                'keyword_data.keyword_info.competition_level',
                'in',
                ['LOW', 'MEDIUM'],
              ],
              ...(inputData.keywordsBlacklist?.length
                ? [
                    'and',
                    [
                      'keyword_data.keyword',
                      'not_in',
                      inputData.keywordsBlacklist,
                    ],
                  ]
                : []),
            ],
          }),
        ]);

        const related =
          task?.tasks?.[0]?.result?.[0]?.items?.map(
            (item) => item?.keyword_data
          ) || [];

        return {
          cost: task?.cost || 0,
          related,
        };
      },
      { concurrency: 10 }
    );

    relatedTotalCost = relatedResponse.reduce(
      (sum, result) => sum + result.cost,
      0
    );
    const allRelated =
      relatedResponse
        .flatMap((result) => result.related)
        ?.filter((item) => !!item) || [];

    relatedKeywordsFiltered = await filterKeywordsAI(allRelated);

    if (relatedKeywordsFiltered.length < 30) {
      // Call googleKeywordSuggestionsLive for each seed keyword with concurrency
      const results = await pMap(
        seedKeywords || [],
        async (seedKeyword) => {
          console.log(`Fetching keyword suggestions for: ${seedKeyword}`);

          const task = await clientLabs.googleKeywordSuggestionsLive([
            new DataForSEO.DataforseoLabsGoogleKeywordSuggestionsLiveRequestInfo(
              {
                keyword: seedKeyword,
                language_code: getLanguageCode(product?.language || ''),
                location_code: getLocationCode(product?.country || ''),
                include_seed_keyword: false,
                include_serp_info: false,
                order_by: ['keyword_info.search_volume,desc'],
                limit: 100,
                filters: [
                  ['search_intent_info.main_intent', '=', 'informational'],
                  'and',
                  ['keyword_info.search_volume', '>', 10],
                  'and',
                  ['keyword_info.competition_level', 'in', ['LOW', 'MEDIUM']],
                  ...(inputData.keywordsBlacklist?.length
                    ? [
                        'and',
                        ['keyword', 'not_in', inputData.keywordsBlacklist],
                      ]
                    : []),
                ],
              }
            ),
          ]);

          const suggestions =
            task?.tasks?.[0]?.result?.[0]?.items?.map((item) => item) || [];

          return {
            cost: task?.cost || 0,
            suggestions,
          };
        },
        { concurrency: 10 }
      );

      suggestionsTotalCost = results.reduce(
        (sum, result) => sum + result.cost,
        0
      );
      const allSuggestions =
        results
          .flatMap((result) => result.suggestions)
          ?.filter((item) => !!item) || [];

      suggestionsKeywordsFiltered = await filterKeywordsAI(allSuggestions);
    }

    const allKeywords = [
      ...filteredKeywordsIdeas,
      ...relatedKeywordsFiltered,
      ...suggestionsKeywordsFiltered,
    ].map(
      (keyword) =>
        ({
          keyword: keyword.keyword!,
          keywordDifficulty: keyword.keyword_properties?.keyword_difficulty,
          searchVolume: keyword.keyword_info?.search_volume,
          intent: keyword.search_intent_info?.main_intent,
          competitionLevel: keyword.keyword_info?.competition_level,
        }) satisfies z.infer<typeof DataForSEOLabsKeywordSchema>
    );

    // Remove duplicates based on keyword (case-insensitive)
    const uniqueKeywordsMap = new Map<
      string,
      z.infer<typeof DataForSEOLabsKeywordSchema>
    >();
    allKeywords.forEach((item) => {
      const normalizedKeyword = item.keyword.toLowerCase();
      if (!uniqueKeywordsMap.has(normalizedKeyword)) {
        uniqueKeywordsMap.set(normalizedKeyword, item);
      }
    });

    const growedKeywords = Array.from(uniqueKeywordsMap.values());
    const totalCost = relatedTotalCost + suggestionsTotalCost;

    console.log(`Total DataForSEO API cost: $${totalCost}`);
    console.log(`Total suggestions collected: ${growedKeywords.length}`);

    return {
      ...inputData,
      growedSeedKeywords: growedKeywords,
    };
  },
});

export default growSeedKeywordsStep;

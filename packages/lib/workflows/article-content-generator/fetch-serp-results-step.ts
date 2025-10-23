import { createStep } from '@mastra/core/workflows';
import axios from 'axios';
import { WorkflowDTO } from './schemas';
import { getLanguageCode, getLocationCode } from '../../dataforseo';

// DataForSEO API credentials from environment
const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN || '';
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD || '';

// Step 1: Fetch SERP Results from DataForSEO
const fetchSerpResultsStep = createStep({
  id: 'fetch-serp-results',
  inputSchema: WorkflowDTO,
  outputSchema: WorkflowDTO,
  execute: async ({ inputData }) => {
    const { article, product } = inputData;

    try {
      // Prepare DataForSEO API request
      const requestData = [
        {
          keyword: article?.keyword,
          location_code: getLocationCode(product?.country!),
          language_code: getLanguageCode(product?.language!),
          device: 'desktop',
          os: 'windows',
          depth: 10, // Get top 10 results
        },
      ];

      // Make API request to DataForSEO
      const response = await axios.post(
        'https://api.dataforseo.com/v3/serp/google/organic/live/advanced',
        requestData,
        {
          auth: {
            username: DATAFORSEO_LOGIN,
            password: DATAFORSEO_PASSWORD,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (
        !response.data ||
        !response.data.tasks ||
        response.data.tasks.length === 0
      ) {
        throw new Error('No SERP results returned from DataForSEO');
      }

      const task = response.data.tasks[0];
      if (task.status_code !== 20000) {
        throw new Error(
          `DataForSEO API error: ${task.status_message || 'Unknown error'}`
        );
      }

      // Extract organic results (exclude ads)
      const items = task.result?.[0]?.items || [];
      const organicResults = items
        .filter(
          (item: any) => item.type === 'organic' && item.url && item.title
        )
        .slice(0, 3) // Get top 3 organic results
        .map((item: any, index: number) => ({
          position: item.rank_absolute || index + 1,
          url: item.url,
          title: item.title,
          description: item.description || '',
          // Check if DataForSEO provides HTML content
          html: item.html || item.content || undefined,
        }));

      if (organicResults.length === 0) {
        console.warn(
          'No organic results found, proceeding without SERP analysis'
        );
      }

      return {
        ...inputData,
        serpResults: organicResults,
      };
    } catch (error) {
      console.error('Error fetching SERP results:', error);
      // Continue workflow without SERP data rather than failing
      return {
        ...inputData,
        serpResults: [],
      };
    }
  },
});

export default fetchSerpResultsStep;

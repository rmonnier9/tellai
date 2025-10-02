/**
 * Example usage of the business data extractor workflow
 *
 * This file demonstrates how to use the businessDataExtractorWorkflow
 * to extract business information from a website URL.
 */

import { mastra } from '../mastra';

export async function extractBusinessData(url: string) {
  try {
    // Execute the workflow
    const result = await mastra.workflows.businessDataExtractorWorkflow.execute(
      {
        triggerData: { url },
      }
    );

    console.log('Business data extracted:', result);
    return result;
  } catch (error) {
    console.error('Error extracting business data:', error);
    throw error;
  }
}

// Example usage:
// const data = await extractBusinessData('https://example.com');
// console.log(data);
//
// Expected output:
// {
//   url: 'https://example.com',
//   logo: 'data:image/png;base64,...',
//   name: 'Example Business',
//   language: 'en',
//   country: 'US',
//   description: 'A detailed description of what the business does...',
//   targetAudiences: [
//     'Small business owners',
//     'E-commerce retailers',
//     'Customer support teams'
//   ]
// }

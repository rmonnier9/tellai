import { articleContentGeneratorWorkflow } from './article-content-generator';

/**
 * Example usage of the article content generator workflow (v2.0)
 *
 * This workflow generates SEO-optimized article content with competitive SERP analysis.
 * It uses DataForSEO to analyze top-ranking content and generates articles that are
 * optimized to compete in search results.
 *
 * The workflow now includes:
 * 1. SERP analysis of top 3 organic results
 * 2. Competitor content scraping and analysis
 * 3. AI-powered competitive brief generation
 * 4. Enhanced content generation with competitive insights
 */

/**
 * Example 1: Generate a how-to guide with SERP analysis
 */
async function generateHowToGuide() {
  try {
    const result = await articleContentGeneratorWorkflow.execute({
      triggerData: {
        articleId: 'art_how_to_guide_123',
        articleData: {
          keyword: 'how to optimize website speed',
          title: null, // Let AI generate based on competitive analysis
          type: 'guide',
          guideSubtype: 'how_to',
          searchVolume: 8100,
          keywordDifficulty: 52,
          cpc: 3.5,
          competition: 0.65,
        },
        productData: {
          name: 'SpeedBoost Pro',
          description: 'Website performance optimization tool for developers',
          url: 'https://speedboost.pro',
          language: 'en',
          country: 'US',
          targetAudiences: [
            'web developers',
            'site owners',
            'digital marketers',
          ],
          bestArticles: [],
          articleStyle: 'technical but approachable',
          internalLinks: 3,
          globalInstructions: 'Include code examples where relevant',
          includeYoutubeVideo: true,
          includeCallToAction: true,
          includeInfographics: false,
          includeEmojis: false,
        },
      },
    });

    console.log('✅ How-to Guide Generated Successfully!');
    console.log('Title:', result.title);
    console.log('Slug:', result.slug);
    console.log('Meta Description:', result.metaDescription);
    console.log('\nContent Preview:');
    console.log(result.content.substring(0, 500) + '...');
    console.log('\nFull content length:', result.content.length, 'characters');

    return result;
  } catch (error) {
    console.error('Error generating how-to guide:', error);
    throw error;
  }
}

/**
 * Example 2: Generate a comparison guide
 */
async function generateComparisonGuide() {
  try {
    const result = await articleContentGeneratorWorkflow.execute({
      triggerData: {
        articleId: 'art_comparison_456',
        articleData: {
          keyword: 'react vs vue comparison',
          title: 'React vs Vue: A Comprehensive Comparison for 2024',
          type: 'guide',
          guideSubtype: 'comparison',
          searchVolume: 12500,
          keywordDifficulty: 68,
          cpc: 2.8,
          competition: 0.72,
        },
        productData: {
          name: 'DevDocs Pro',
          description: 'Technical documentation and learning platform',
          url: 'https://devdocs.pro',
          language: 'en',
          country: 'US',
          targetAudiences: ['developers', 'tech leads', 'students'],
          bestArticles: ['https://example.com/blog/best-comparison'],
          articleStyle: 'neutral and objective',
          internalLinks: 5,
          globalInstructions: 'Be balanced and fair to both technologies',
          includeYoutubeVideo: false,
          includeCallToAction: true,
          includeInfographics: true,
          includeEmojis: false,
        },
      },
    });

    console.log('✅ Comparison Guide Generated!');
    console.log('Title:', result.title);
    return result;
  } catch (error) {
    console.error('Error generating comparison guide:', error);
    throw error;
  }
}

/**
 * Example 3: Generate a listicle (round-up)
 */
async function generateRoundUpListicle() {
  try {
    const result = await articleContentGeneratorWorkflow.execute({
      triggerData: {
        articleId: 'art_listicle_789',
        articleData: {
          keyword: 'best project management tools',
          type: 'listicle',
          listicleSubtype: 'round_up',
          searchVolume: 22000,
          keywordDifficulty: 75,
          cpc: 12.5,
          competition: 0.89,
        },
        productData: {
          name: 'TaskFlow',
          description: 'Modern project management platform',
          url: 'https://taskflow.io',
          language: 'en',
          country: 'US',
          targetAudiences: [
            'project managers',
            'team leads',
            'small business owners',
          ],
          bestArticles: [],
          articleStyle: 'professional and authoritative',
          internalLinks: 7,
          globalInstructions: 'Focus on practical insights and real use cases',
          includeYoutubeVideo: true,
          includeCallToAction: true,
          includeInfographics: true,
          includeEmojis: false,
        },
      },
    });

    console.log('✅ Listicle Generated!');
    console.log('Title:', result.title);
    return result;
  } catch (error) {
    console.error('Error generating listicle:', error);
    throw error;
  }
}

/**
 * Example 4: Generate with minimal data (graceful degradation)
 * If SERP analysis fails, the workflow will still generate content
 */
async function generateWithMinimalData() {
  try {
    const result = await articleContentGeneratorWorkflow.execute({
      triggerData: {
        articleId: 'art_minimal_999',
        articleData: {
          keyword: 'content marketing tips',
          type: 'guide',
          guideSubtype: 'explainer',
          searchVolume: null,
          keywordDifficulty: null,
          cpc: null,
          competition: null,
        },
        productData: {
          name: null,
          description: null,
          url: 'https://example.com',
          language: null,
          country: null,
          targetAudiences: ['marketers'],
          bestArticles: [],
          articleStyle: 'conversational',
          internalLinks: 0,
          globalInstructions: null,
          includeYoutubeVideo: false,
          includeCallToAction: false,
          includeInfographics: false,
          includeEmojis: false,
        },
      },
    });

    console.log('✅ Article Generated (with minimal data)!');
    console.log('Title:', result.title);
    return result;
  } catch (error) {
    console.error('Error generating with minimal data:', error);
    throw error;
  }
}

/**
 * Example 5: Batch generation with progress tracking
 */
async function generateMultipleArticles(
  articles: Array<{
    articleId: string;
    keyword: string;
    type: 'guide' | 'listicle';
  }>
) {
  const results = [];
  let successCount = 0;
  let failCount = 0;

  console.log(
    `\n🚀 Starting batch generation of ${articles.length} articles...\n`
  );

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    try {
      console.log(
        `[${i + 1}/${articles.length}] Generating: "${article.keyword}"...`
      );

      const result = await articleContentGeneratorWorkflow.execute({
        triggerData: {
          articleId: article.articleId,
          articleData: {
            keyword: article.keyword,
            type: article.type,
            guideSubtype: article.type === 'guide' ? 'how_to' : null,
            listicleSubtype: article.type === 'listicle' ? 'round_up' : null,
            searchVolume: null,
            keywordDifficulty: null,
            cpc: null,
            competition: null,
          },
          productData: {
            name: 'My Product',
            description: 'Product description',
            url: 'https://example.com',
            targetAudiences: ['general audience'],
            bestArticles: [],
            articleStyle: 'conversational',
            internalLinks: 3,
            includeYoutubeVideo: false,
            includeCallToAction: true,
            includeInfographics: false,
            includeEmojis: false,
          },
        },
      });

      results.push(result);
      successCount++;
      console.log(
        `  ✅ Success: ${result.title} (${result.content.length} chars)\n`
      );

      // Rate limiting: wait 2 seconds between requests
      if (i < articles.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      failCount++;
      console.error(`  ❌ Failed: ${error}\n`);
    }
  }

  console.log(`\n📊 Batch Generation Complete:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(
    `   📈 Success Rate: ${((successCount / articles.length) * 100).toFixed(1)}%\n`
  );

  return results;
}

/**
 * Example 6: Generate with retry logic and exponential backoff
 */
async function generateWithRetry(triggerData: any, maxRetries: number = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries}...`);
      const result = await articleContentGeneratorWorkflow.execute({
        triggerData,
      });
      console.log('✅ Success!');
      return result;
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error);
      lastError = error;

      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Waiting ${waitTime}ms before retry...\n`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw new Error(
    `Failed to generate article after ${maxRetries} attempts: ${lastError}`
  );
}

/**
 * Run examples
 */
async function runAllExamples() {
  console.log('='.repeat(60));
  console.log('Article Content Generator v2.0 - Examples');
  console.log('='.repeat(60) + '\n');

  try {
    // Uncomment the example you want to run:

    // await generateHowToGuide();
    // await generateComparisonGuide();
    // await generateRoundUpListicle();
    // await generateWithMinimalData();

    // Batch example:
    // await generateMultipleArticles([
    //   { articleId: 'art_1', keyword: 'how to learn javascript', type: 'guide' },
    //   { articleId: 'art_2', keyword: 'best coding tutorials', type: 'listicle' },
    //   { articleId: 'art_3', keyword: 'python vs javascript', type: 'guide' },
    // ]);

    console.log('\n✅ All examples completed!');
  } catch (error) {
    console.error('\n❌ Example failed:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllExamples()
    .then(() => console.log('\n🎉 Done!'))
    .catch((error) => console.error('\n💥 Fatal error:', error));
}

export {
  generateHowToGuide,
  generateComparisonGuide,
  generateRoundUpListicle,
  generateWithMinimalData,
  generateMultipleArticles,
  generateWithRetry,
  runAllExamples,
};

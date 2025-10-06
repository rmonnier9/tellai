import { articleContentGeneratorWorkflow } from './article-content-generator';

/**
 * Example usage of the article content generator workflow
 *
 * This workflow generates SEO-optimized article content based on an Article ID
 * from the database. The generated content will be in markdown format and
 * optimized for the article's target keyword and type.
 */

async function generateArticleContent() {
  try {
    // Example: Generate content for an article
    const result = await articleContentGeneratorWorkflow.execute({
      articleId: 'your-article-id-here', // Replace with actual article ID
    });

    console.log('Article generated successfully!');
    console.log('Title:', result.title);
    console.log('Slug:', result.slug);
    console.log('Meta Description:', result.metaDescription);
    console.log('\nContent Preview:');
    console.log(result.content.substring(0, 500) + '...');
    console.log('\nFull content length:', result.content.length, 'characters');

    // You can now save this content back to the database
    // Example:
    // await prisma.article.update({
    //   where: { id: result.articleId },
    //   data: {
    //     content: result.content,
    //     title: result.title,
    //     status: 'generated',
    //   },
    // });

    return result;
  } catch (error) {
    console.error('Error generating article:', error);
    throw error;
  }
}

// Example: Generate content for multiple articles
async function generateMultipleArticles(articleIds: string[]) {
  const results = [];

  for (const articleId of articleIds) {
    try {
      console.log(`Generating content for article ${articleId}...`);
      const result = await articleContentGeneratorWorkflow.execute({
        articleId,
      });
      results.push(result);
      console.log(`✓ Completed: ${result.title}`);
    } catch (error) {
      console.error(`✗ Failed for article ${articleId}:`, error);
    }
  }

  return results;
}

// Example: Generate content with error handling and retry logic
async function generateArticleWithRetry(
  articleId: string,
  maxRetries: number = 3
) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries} for article ${articleId}`);
      const result = await articleContentGeneratorWorkflow.execute({
        articleId,
      });
      console.log('✓ Success!');
      return result;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      lastError = error;

      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw new Error(
    `Failed to generate article after ${maxRetries} attempts: ${lastError}`
  );
}

// Run if executed directly
if (require.main === module) {
  generateArticleContent()
    .then(() => console.log('Done!'))
    .catch((error) => console.error('Fatal error:', error));
}

export {
  generateArticleContent,
  generateMultipleArticles,
  generateArticleWithRetry,
};

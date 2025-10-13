import { articleContentGeneratorWorkflow } from './article-content-generator';

/**
 * Example usage of the enhanced article content generator workflow with image generation
 *
 * This workflow now:
 * 1. Generates SEO-optimized article content
 * 2. Analyzes the content to determine optimal image placements
 * 3. Generates up to 4 AI images:
 *    - 1 hero image for the main article
 *    - Up to 3 supporting images (section images or diagrams)
 * 4. Uses Product.imageStyle for styling (except for diagrams)
 * 5. Can generate simple diagrams for explaining complex concepts
 */

async function generateArticleWithImages() {
  const result = await articleContentGeneratorWorkflow.execute({
    articleId: 'art_example123',
    articleData: {
      keyword: 'how to use react hooks',
      title: 'Complete Guide to React Hooks',
      type: 'guide',
      guideSubtype: 'how_to',
      listicleSubtype: null,
      searchVolume: 5000,
      keywordDifficulty: 45,
      cpc: 2.5,
      competition: 0.7,
    },
    productData: {
      name: 'React Academy',
      description: 'Learn React development from experts',
      url: 'https://reactacademy.com',
      language: 'en',
      country: 'US',
      targetAudiences: ['developers', 'students', 'bootcamp learners'],
      bestArticles: ['https://reactacademy.com/best-practices'],
      articleStyle: 'educational and practical',
      internalLinks: 3,
      globalInstructions: 'Focus on practical examples and code snippets',
      includeYoutubeVideo: true,
      includeCallToAction: true,
      includeInfographics: true,
      includeEmojis: false,
      // Image generation settings
      imageStyle: 'minimalist', // Options: 'brand-text', 'photographic', 'illustration', 'abstract', 'minimalist'
      brandColor: '#61DAFB', // React blue color
    },
  });

  console.log('Article generated successfully!');
  console.log('Title:', result.title);
  console.log('Slug:', result.slug);
  console.log('Generated images:', result.images.length);

  result.images.forEach((image, index) => {
    console.log(`\nImage ${index + 1}:`);
    console.log('- Type:', image.type);
    console.log('- Placement:', image.placement);
    console.log('- Alt Text:', image.altText);
    console.log('- URL:', image.url);
  });

  return result;
}

// Export for use in other files
export { generateArticleWithImages };

/**
 * Image Style Options:
 *
 * - 'brand-text': Clean, professional design with text overlay. Modern and minimalist.
 * - 'photographic': Photorealistic, high quality photography style.
 * - 'illustration': Modern illustration style, vibrant colors.
 * - 'abstract': Abstract, artistic interpretation with geometric shapes.
 * - 'minimalist': Minimalist design with clean lines and simple composition.
 *
 * Image Types Generated:
 *
 * - 'hero': Main article image (16:9 aspect ratio)
 * - 'section': Illustrative image for specific sections (1:1 aspect ratio)
 * - 'diagram': Simple diagram to explain concepts (1:1 aspect ratio)
 *
 * Note: Diagrams always use a clear, educational style regardless of imageStyle setting.
 */

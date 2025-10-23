import { createStep } from '@mastra/core/workflows';
import { WorkflowDTO } from './schemas';
import { generateImage } from './../../generate-image';

// Step 7: Generate images using Replicate
const generateImagesStep = createStep({
  id: 'generate-images',
  inputSchema: WorkflowDTO,
  outputSchema: WorkflowDTO,
  execute: async ({ inputData }) => {
    const { imagePlan, product, articleId } = inputData;

    const imageStyle = product?.imageStyle || 'brand-text';
    const brandColor = product?.brandColor || '#000000';

    const generatedImages = [];

    // Generate each image
    for (const plan of imagePlan || []) {
      try {
        // Build the final prompt - keep it concise
        let finalPrompt = plan.prompt;

        // For non-diagram images, apply minimal style based on preference
        if (plan.type !== 'diagram') {
          // Add minimal style suffix based on imageStyle preference
          switch (imageStyle) {
            case 'brand-text':
              finalPrompt = `${finalPrompt}, professional minimal design`;
              break;
            case 'photographic':
              finalPrompt = `${finalPrompt}, photorealistic`;
              break;
            case 'illustration':
              finalPrompt = `${finalPrompt}, modern illustration`;
              break;
            case 'abstract':
              finalPrompt = `${finalPrompt}, abstract geometric`;
              break;
            case 'minimalist':
              finalPrompt = `${finalPrompt}, minimalist`;
              break;
            default:
              finalPrompt = `${finalPrompt}, professional`;
          }
        } else {
          // For diagrams, keep it simple
          finalPrompt = `Simple diagram: ${finalPrompt}`;
        }

        // Add custom style modifier if provided (keep it short)
        if (plan.styleModifier) {
          finalPrompt = `${finalPrompt}, ${plan.styleModifier}`;
        }

        console.log(
          `Generating ${plan.type} image with prompt (${finalPrompt.split(' ').length} words):`,
          finalPrompt
        );

        // Generate the image and upload to S3
        const imageUrl = await generateImage({
          prompt: finalPrompt,
          aspect_ratio: plan.type === 'hero' ? '16:9' : '1:1',
          s3Path: `articles/${articleId}`,
        });

        generatedImages.push({
          url: imageUrl,
          type: plan.type,
          placement: plan.placement,
          altText: plan.altText,
        });

        console.log(`Successfully generated ${plan.type} image`);
      } catch (error) {
        console.error(`Error generating ${plan.type} image:`, error);
        // Continue with other images even if one fails
      }
    }

    // If no images were generated successfully, create a fallback
    if (generatedImages.length === 0) {
      console.warn(
        'No images generated successfully, skipping image generation'
      );
    }

    return {
      ...inputData,
      images: generatedImages,
    };
  },
});

export default generateImagesStep;

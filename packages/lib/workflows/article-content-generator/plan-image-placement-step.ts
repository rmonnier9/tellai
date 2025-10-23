import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { ImagePlanSchema, WorkflowDTO } from './schemas';
import { imageStrategist } from './agents';

// Step 6: Analyze content and plan image placement
const planImagePlacementStep = createStep({
  id: 'plan-image-placement',
  inputSchema: WorkflowDTO,
  outputSchema: WorkflowDTO,
  execute: async ({ inputData }) => {
    const { article, articleContent } = inputData;

    const analysisPrompt = `You are analyzing an article to determine the best image placement strategy.

## ARTICLE INFORMATION

**Title**: ${articleContent?.title}
**Keyword**: ${article?.keyword || 'Unknown'}
**Type**: ${article?.type || 'Unknown'}

**Full Article Content**:
${articleContent?.content}

## YOUR TASK

Create a strategic plan for up to 4 images that will enhance this article:

1. **Hero Image** (Required): The main visual that represents the article's topic
   - Should capture the essence of the entire article
   - Will be displayed prominently at the top
   - Should be eye-catching and relevant

2. **Supporting Images** (2-3 images): Enhance specific sections
   - **CRITICAL**: Distribute images EVENLY throughout the article
   - Look at ALL section headings and choose sections from different parts:
     * One image in the early/beginning sections (first 25% of content)
     * One image in the middle sections (middle 50% of content)
     * One image in the later sections (last 25% of content)
   - Consider diagrams for complex concepts that need explanation
   - Consider illustrative images for examples or key points
   - Don't add images just for decoration - each must add value
   - Don't cluster all images in one area

## IMAGE TYPES

- **hero**: Main article image
- **section**: Illustrative image for a specific section
- **diagram**: Simple diagram to explain a concept (e.g., flowchart, process diagram, comparison chart)

## OUTPUT REQUIREMENTS

For each image, provide:

1. **type**: hero, section, or diagram
2. **placement**: The EXACT heading or section title where this image should appear (e.g., "How It Works", "Benefits", "Step-by-Step Guide"). For hero image, use "hero".
3. **prompt**: A CONCISE, specific prompt for image generation (max 30 words)
   - Focus on the core visual concept only
   - For hero/section images: Main subject and style only (e.g., "Modern workspace with laptop, notebook, and coffee cup, minimalist aesthetic")
   - For diagrams: Core concept only (e.g., "Flowchart showing user registration process with 4 steps")
   - Avoid lengthy descriptions - be direct and specific
4. **altText**: SEO-optimized alt text (concise but descriptive, max 100 characters)
5. **styleModifier**: Additional style instructions (optional, max 10 words)

## GUIDELINES

- Always include 1 hero image
- Include 2-3 additional images only where they add real value
- **DISTRIBUTE EVENLY**: Analyze all headings and choose sections from different parts of the article (beginning, middle, end)
- For technical/educational content, consider diagrams
- Keep prompts CONCISE - shorter prompts (20-30 words) generate better quality images
- Match placement to actual section headings in the article (copy the exact heading text)
- Consider the article's tone and target audience
- Avoid placing multiple images in consecutive sections

## DISTRIBUTION STRATEGY

1. First, list ALL major headings (H2) in the article
2. Divide them into thirds: early, middle, late
3. Select one heading from each third for image placement
4. Ensure maximum spacing between images

Return a JSON array of image plans (1-4 images total).`;

    try {
      const result = await imageStrategist.generateVNext(analysisPrompt, {
        output: z.object({
          images: z.array(ImagePlanSchema).max(4),
        }),
      });

      return {
        ...inputData,
        imagePlan: result.object.images,
      };
    } catch (error) {
      console.error('Error planning image placement:', error);
      // Fallback: just create a hero image
      return {
        ...inputData,
        imagePlan: [
          {
            type: 'hero' as const,
            placement: 'Top of article',
            prompt: `Professional header image representing: ${articleContent?.title}`,
            altText: articleContent?.title!,
          } satisfies z.infer<typeof ImagePlanSchema>,
        ],
      };
    }
  },
});

export default planImagePlacementStep;

import { createStep } from '@mastra/core/workflows';
import { WorkflowDTO } from './schemas';

// Step 8: Insert images into the article content
const insertImagesIntoContentStep = createStep({
  id: 'insert-images-into-content',
  inputSchema: WorkflowDTO,
  outputSchema: WorkflowDTO,
  execute: async ({ inputData }) => {
    const { images, articleContent } = inputData;

    if (!images || images.length === 0) {
      console.log('No images to insert into content');
      return inputData;
    }

    let updatedContent = articleContent?.content || '';

    // Analyze article structure for distribution logging
    const lines = updatedContent.split('\n');
    const headings = lines
      .map((line, idx) => ({
        line: line.trim(),
        index: idx,
      }))
      .filter((item) => item.line.startsWith('##'))
      .map((item) => ({
        text: item.line.replace(/^#+\s*/, ''),
        index: item.index,
      }));

    console.log(
      `Article has ${headings.length} H2 headings across ${lines.length} lines`
    );
    if (headings.length > 0) {
      console.log('Headings:', headings.map((h) => h.text).join(', '));
    }

    // Sort images: hero first, then others
    const sortedImages = [...images].sort((a, b) => {
      if (a.type === 'hero') return -1;
      if (b.type === 'hero') return 1;
      return 0;
    });

    console.log(
      `Inserting ${sortedImages.length} images with placements:`,
      sortedImages.map((img) => `${img.type}: "${img.placement}"`).join(', ')
    );

    for (const image of sortedImages) {
      // Skip hero/featured image - it's stored separately in featuredImageUrl field
      if (image.type === 'hero' || image.placement.toLowerCase() === 'hero') {
        console.log(
          `Skipping hero image insertion (stored in featuredImageUrl field)`
        );
        continue;
      }

      const imageMarkdown = `![${image.altText}](${image.url})\n\n`;

      // For section images, find the heading that matches the placement
      // Try to match exact heading or heading that contains the placement text
      const lines = updatedContent.split('\n');
      let insertIndex = -1;
      let bestMatch = -1;
      let bestMatchScore = 0;

      // Look for the best matching heading
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        const trimmedLine = line.trim();
        // Check if it's a heading (starts with #)
        if (trimmedLine.startsWith('#')) {
          const headingText = trimmedLine.replace(/^#+\s*/, '').toLowerCase();
          const placementText = image.placement.toLowerCase();

          // Exact match
          if (headingText === placementText) {
            insertIndex = i;
            break;
          }

          // Partial match - calculate score
          if (
            headingText.includes(placementText) ||
            placementText.includes(headingText)
          ) {
            const score = Math.max(headingText.length, placementText.length);
            if (score > bestMatchScore) {
              bestMatchScore = score;
              bestMatch = i;
            }
          }
        }
      }

      // Use best match if no exact match found
      if (insertIndex === -1 && bestMatch !== -1) {
        insertIndex = bestMatch;
      }

      if (insertIndex !== -1) {
        // Insert image after the heading (skip any empty lines)
        let insertPosition = insertIndex + 1;
        while (insertPosition < lines.length) {
          const currentLine = lines[insertPosition];
          if (!currentLine || currentLine.trim() === '') {
            insertPosition++;
          } else {
            break;
          }
        }

        lines.splice(insertPosition, 0, '', imageMarkdown.trim());
        updatedContent = lines.join('\n');
        const headingLine = lines[insertIndex];
        console.log(
          `Inserted ${image.type} image after heading: ${headingLine || 'unknown'}`
        );
      } else {
        // If no matching heading found, append at the end of content
        console.warn(
          `Could not find heading matching "${image.placement}", appending image at end`
        );
        updatedContent = `${updatedContent}\n\n${imageMarkdown}`;
      }
    }

    console.log(`Successfully inserted ${images.length} images into content`);

    return {
      ...inputData,
      articleContent: {
        ...articleContent!,
        content: updatedContent,
      },
    };
  },
});

export default insertImagesIntoContentStep;

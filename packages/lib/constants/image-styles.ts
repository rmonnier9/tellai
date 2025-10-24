export const IMAGE_STYLES = {
  'brand-text': {
    label: 'Brand & Text',
    description:
      'Photo-realistic scenes with text matching your article content and background using your brand color.',
    generationPrompt:
      'photo-realistic scenes with text matching your article content and background using your brand color',
  },
  watercolor: {
    label: 'Watercolor',
    description:
      'Photo-realistic scenes with artistic watercolor effects, creating a soft and elegant look.',
    generationPrompt:
      'photo-realistic scenes with artistic watercolor effects, creating a soft and elegant look',
  },
  cinematic: {
    label: 'Cinematic',
    description:
      'Dramatic, movie-like scenes with professional lighting and composition for maximum visual impact.',
    generationPrompt:
      'dramatic, movie-like scenes with professional lighting and composition for maximum visual impact',
  },
  illustration: {
    label: 'Illustration',
    description:
      'Clean, modern illustrations with bold colors and simplified shapes for clear communication.',
    generationPrompt:
      'clean, modern illustrations with bold colors and simplified shapes for clear communication',
  },
  sketch: {
    label: 'Sketch',
    description:
      'Hand-drawn style sketches with organic lines and artistic flair for a personal touch.',
    generationPrompt:
      'hand-drawn style sketches with organic lines and artistic flair for a personal touch',
  },
} as const;

export type ImageStyleKey = keyof typeof IMAGE_STYLES;

export const IMAGE_STYLE_OPTIONS = Object.entries(IMAGE_STYLES).map(
  ([value, config]) => ({
    value,
    label: config.label,
    description: config.description,
    generationPrompt: config.generationPrompt,
  })
);

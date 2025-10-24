import { Image } from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageNodeView } from './image-node-view';

export type UploadFunction = (
  file: File,
  onProgress: (event: { progress: number }) => void,
  abortSignal: AbortSignal
) => Promise<string>;

export interface ImageNodeOptions {
  /**
   * Function to handle the upload process for image replacement.
   */
  upload?: UploadFunction;
  /**
   * Callback for upload errors.
   */
  onError?: (error: Error) => void;
  /**
   * Callback for successful uploads.
   */
  onSuccess?: (url: string) => void;
  /**
   * HTML attributes to add to the image element.
   */
  HTMLAttributes?: Record<string, unknown>;
}

/**
 * Extended Image node that supports image replacement
 */
export const ImageNode = Image.extend<ImageNodeOptions>({
  addOptions() {
    return {
      ...this.parent?.(),
      upload: undefined,
      onError: undefined,
      onSuccess: undefined,
    };
  },

  addNodeView() {
    // Always use custom node view - it handles missing upload gracefully
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

'use client';

import * as React from 'react';
import type { NodeViewProps } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import { Button } from '@workspace/ui/components/tiptap-ui-primitive/button';
import { Loader2 } from 'lucide-react';

/**
 * Custom node view for images that allows replacing them
 */
export const ImageNodeView: React.FC<NodeViewProps> = (props) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const { src, alt, title } = props.node.attrs;
  const extension = props.extension;
  const uploadFunction = extension.options.upload;

  const handleReplace = () => {
    if (inputRef.current && !isUploading) {
      inputRef.current.value = '';
      inputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadFunction) return;

    setIsUploading(true);

    try {
      // Create abort controller for cancellation
      const abortController = new AbortController();

      // Upload the new file
      const newUrl = await uploadFunction(
        file,
        (event: { progress: number }) => {
          // Progress callback - could be used to show progress
          console.log('Upload progress:', event.progress);
        },
        abortController.signal
      );

      if (newUrl && !abortController.signal.aborted) {
        // Update the image node with new URL
        const filename = file.name.replace(/\.[^/.]+$/, '') || alt || 'image';
        props.updateAttributes({
          src: newUrl,
          alt: filename,
          title: filename,
        });
      }
    } catch (error) {
      console.error('Failed to replace image:', error);
      extension.options.onError?.(
        error instanceof Error ? error : new Error('Failed to replace image')
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <NodeViewWrapper
      className="tiptap-image-node-wrapper"
      data-drag-handle
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="tiptap-image-container">
        <img src={src} alt={alt || ''} title={title || ''} />

        {/* Show replace button when selected or hovered, and upload function is available */}
        {(props.selected || isHovered) &&
          props.editor.isEditable &&
          uploadFunction && (
            <div className="tiptap-image-controls">
              <Button
                type="button"
                onClick={handleReplace}
                disabled={isUploading}
                className="tiptap-image-replace-button"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="tiptap-button-icon animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <span>Replace Image</span>
                )}
              </Button>
            </div>
          )}

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
    </NodeViewWrapper>
  );
};

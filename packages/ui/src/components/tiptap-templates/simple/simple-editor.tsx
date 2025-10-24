'use client';

import * as React from 'react';
import { EditorContent, EditorContext, useEditor } from '@tiptap/react';

import { Markdown } from '@tiptap/markdown';

// --- Tiptap Core Extensions ---
import { StarterKit } from '@tiptap/starter-kit';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { TextAlign } from '@tiptap/extension-text-align';
import { Typography } from '@tiptap/extension-typography';
import { Highlight } from '@tiptap/extension-highlight';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Selection } from '@tiptap/extensions';

// --- UI Primitives ---
import { Button } from '@workspace/ui/components/tiptap-ui-primitive/button';
import { Spacer } from '@workspace/ui/components/tiptap-ui-primitive/spacer';
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from '@workspace/ui/components/tiptap-ui-primitive/toolbar';

// --- Tiptap Node ---
import { ImageUploadNode } from '@workspace/ui/components/tiptap-node/image-upload-node/image-upload-node-extension';
import { ImageNode } from '@workspace/ui/components/tiptap-node/image-node';
import { HorizontalRule } from '@workspace/ui/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension';
import '@workspace/ui/components/tiptap-node/blockquote-node/blockquote-node.scss';
import '@workspace/ui/components/tiptap-node/code-block-node/code-block-node.scss';
import '@workspace/ui/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss';
import '@workspace/ui/components/tiptap-node/list-node/list-node.scss';
import '@workspace/ui/components/tiptap-node/image-node/image-node.scss';
import '@workspace/ui/components/tiptap-node/heading-node/heading-node.scss';
import '@workspace/ui/components/tiptap-node/paragraph-node/paragraph-node.scss';

// --- Tiptap UI ---
import { HeadingDropdownMenu } from '@workspace/ui/components/tiptap-ui/heading-dropdown-menu';
import { ImageUploadButton } from '@workspace/ui/components/tiptap-ui/image-upload-button';
import { ListDropdownMenu } from '@workspace/ui/components/tiptap-ui/list-dropdown-menu';
import { BlockquoteButton } from '@workspace/ui/components/tiptap-ui/blockquote-button';
import { CodeBlockButton } from '@workspace/ui/components/tiptap-ui/code-block-button';
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from '@workspace/ui/components/tiptap-ui/color-highlight-popover';
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from '@workspace/ui/components/tiptap-ui/link-popover';
import { MarkButton } from '@workspace/ui/components/tiptap-ui/mark-button';
import { TextAlignButton } from '@workspace/ui/components/tiptap-ui/text-align-button';
import { UndoRedoButton } from '@workspace/ui/components/tiptap-ui/undo-redo-button';

// --- Icons ---
import { ArrowLeftIcon } from '@workspace/ui/components/tiptap-icons/arrow-left-icon';
import { HighlighterIcon } from '@workspace/ui/components/tiptap-icons/highlighter-icon';
import { LinkIcon } from '@workspace/ui/components/tiptap-icons/link-icon';

// --- Hooks ---
import { useIsMobile } from '@workspace/ui/hooks/use-mobile';
import { useWindowSize } from '@workspace/ui/hooks/use-window-size';
import { useCursorVisibility } from '@workspace/ui/hooks/use-cursor-visibility';

// --- Components ---
import { ThemeToggle } from '@workspace/ui/components/tiptap-templates/simple/theme-toggle';

// --- Lib ---
import {
  handleImageUpload,
  MAX_FILE_SIZE,
} from '@workspace/ui/lib/tiptap-utils';

// --- Styles ---
import '@workspace/ui/components/tiptap-templates/simple/simple-editor.scss';

export interface SimpleEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  editable?: boolean;
  articleId?: string;
  uploadAction?: (formData: FormData) => Promise<string>;
}

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
}: {
  onHighlighterClick: () => void;
  onLinkClick: () => void;
  isMobile: boolean;
}) => {
  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
        <ListDropdownMenu
          types={['bulletList', 'orderedList', 'taskList']}
          portal={isMobile}
        />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton text="Add" />
      </ToolbarGroup>

      <Spacer />

      {isMobile && <ToolbarSeparator />}

      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>
    </>
  );
};

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: 'highlighter' | 'link';
  onBack: () => void;
}) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === 'highlighter' ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === 'highlighter' ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
);

export function SimpleEditor({
  content: initialContent = '### Hello World',
  onChange,
  editable = true,
  articleId,
  uploadAction,
}: SimpleEditorProps = {}) {
  const isMobile = useIsMobile();
  const { height } = useWindowSize();
  const [mobileView, setMobileView] = React.useState<
    'main' | 'highlighter' | 'link'
  >('main');
  const toolbarRef = React.useRef<HTMLDivElement>(null);

  // Create upload handler that includes articleId and uploadAction
  const uploadHandler = React.useCallback(
    async (
      file: File,
      onProgress?: (event: { progress: number }) => void,
      abortSignal?: AbortSignal
    ) => {
      if (!articleId || !uploadAction) {
        console.warn(
          'No articleId or uploadAction provided, using placeholder'
        );
        // Return placeholder if no upload action is configured
        return '/images/tiptap-ui-placeholder-image.jpg';
      }
      return handleImageUpload(
        file,
        articleId,
        uploadAction,
        onProgress,
        abortSignal
      );
    },
    [articleId, uploadAction]
  );

  const editor = useEditor(
    {
      immediatelyRender: false,
      shouldRerenderOnTransaction: false,
      editable,
      editorProps: {
        attributes: {
          autocomplete: 'off',
          autocorrect: 'off',
          autocapitalize: 'off',
          'aria-label': 'Main content area, start typing to enter text.',
          class: 'simple-editor',
        },
      },
      extensions: [
        StarterKit.configure({
          horizontalRule: false,
          link: {
            openOnClick: false,
            enableClickSelection: true,
          },
        }),
        HorizontalRule,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Highlight.configure({ multicolor: true }),
        ImageNode.configure({
          upload: uploadHandler,
          onError: (error) => console.error('Image operation failed:', error),
        }),
        Typography,
        Superscript,
        Subscript,
        Selection,
        ImageUploadNode.configure({
          accept: 'image/*',
          maxSize: MAX_FILE_SIZE,
          limit: 3,
          upload: uploadHandler,
          onError: (error) => console.error('Upload failed:', error),
        }),
        Markdown,
      ],
      content: initialContent,
      contentType: 'markdown',
      onUpdate: ({ editor }) => {
        if (onChange) {
          // Get markdown content directly from editor
          const markdown = editor.getMarkdown();
          onChange(markdown);
        }
      },
    },
    [uploadHandler]
  );

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  });

  React.useEffect(() => {
    if (!isMobile && mobileView !== 'main') {
      setMobileView('main');
    }
  }, [isMobile, mobileView]);

  return (
    <div className="simple-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          style={{
            ...(isMobile
              ? {
                  bottom: `calc(100% - ${height - rect.y}px)`,
                }
              : {}),
          }}
        >
          {mobileView === 'main' ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView('highlighter')}
              onLinkClick={() => setMobileView('link')}
              isMobile={isMobile}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView === 'highlighter' ? 'highlighter' : 'link'}
              onBack={() => setMobileView('main')}
            />
          )}
        </Toolbar>

        <EditorContent
          editor={editor}
          role="presentation"
          className="simple-editor-content"
        />
      </EditorContext.Provider>
    </div>
  );
}

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * Renders markdown content with beautiful typography using Tailwind CSS Typography plugin.
 *
 * @see https://github.com/tailwindlabs/tailwindcss-typography
 */
export function MarkdownContent({
  content,
  className = '',
}: MarkdownContentProps) {
  return (
    <article
      className={`prose prose-slate dark:prose-invert max-w-none ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </article>
  );
}

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { cn } from '@/lib/utils/cn';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

/**
 * MarkdownPreview - Renders Markdown content with GitHub Flavored Markdown support
 *
 * Features:
 * - GitHub Flavored Markdown (tables, strikethrough, task lists)
 * - Sanitized HTML output for security
 * - Syntax highlighting for code blocks
 * - Responsive design
 */
export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none',
        'prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white',
        'prose-p:text-gray-700 dark:prose-p:text-gray-300',
        'prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline',
        'prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-800',
        'prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
        'prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-700',
        'prose-blockquote:border-l-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600',
        'prose-blockquote:pl-4 prose-blockquote:italic',
        'prose-ul:list-disc prose-ol:list-decimal',
        'prose-li:text-gray-700 dark:prose-li:text-gray-300',
        'prose-table:border-collapse prose-table:w-full',
        'prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-600 prose-th:bg-gray-100 dark:prose-th:bg-gray-800',
        'prose-th:px-4 prose-th:py-2 prose-th:text-left',
        'prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-600 prose-td:px-4 prose-td:py-2',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

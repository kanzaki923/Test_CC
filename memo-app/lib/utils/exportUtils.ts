import type { Memo } from '@/lib/types';

/**
 * Export a single memo to JSON format
 */
export function exportToJSON(memo: Memo): string {
  return JSON.stringify(memo, null, 2);
}

/**
 * Export multiple memos to JSON format
 */
export function exportMemosToJSON(memos: Memo[]): string {
  return JSON.stringify(memos, null, 2);
}

/**
 * Format a date for display
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Export a single memo to Markdown format with YAML frontmatter
 */
export function exportToMarkdown(memo: Memo): string {
  const title = memo.title || 'Untitled';
  const tags = memo.tags.length > 0 ? memo.tags : [];

  // YAML frontmatter
  const frontmatter = [
    '---',
    `title: ${title}`,
    `created: ${formatDate(memo.createdAt)}`,
    `updated: ${formatDate(memo.updatedAt)}`,
    `tags: ${tags.length > 0 ? `\n${tags.map(tag => `  - ${tag}`).join('\n')}` : '[]'}`,
    memo.isPinned ? 'pinned: true' : '',
    memo.categoryId ? `category: ${memo.categoryId}` : '',
    '---',
  ]
    .filter(Boolean)
    .join('\n');

  // Combine frontmatter with title and content
  const markdown = [
    frontmatter,
    '',
    `# ${title}`,
    '',
    memo.content,
  ].join('\n');

  return markdown;
}

/**
 * Export a single memo to Markdown format with metadata section
 */
export function exportMemoToMarkdown(memo: Memo): string {
  const title = memo.title || 'Untitled';
  const pinnedIcon = memo.isPinned ? ' 📌' : '';

  // Metadata section
  const metadata = [
    '---',
    `**Tags:** ${memo.tags.join(', ') || 'なし'}`,
    `**Created:** ${formatDate(memo.createdAt)}`,
    `**Updated:** ${formatDate(memo.updatedAt)}`,
    memo.categoryId ? `**Category:** ${memo.categoryId}` : '',
    '---',
  ]
    .filter(Boolean)
    .join('\n');

  // Combine title, metadata, and content
  const markdown = [
    `# ${title}${pinnedIcon}`,
    '',
    metadata,
    '',
    memo.content,
  ].join('\n');

  return markdown;
}

/**
 * Download content as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export and download a single memo as JSON
 */
export function downloadMemoAsJSON(memo: Memo) {
  const json = exportToJSON(memo);
  const filename = `${memo.title || 'memo'}-${Date.now()}.json`;
  downloadFile(json, filename, 'application/json');
}

/**
 * Export and download multiple memos as JSON
 */
export function downloadMemosAsJSON(memos: Memo[], filename: string = 'memos.json') {
  const json = exportMemosToJSON(memos);
  downloadFile(json, filename, 'application/json');
}

/**
 * Export and download a single memo as Markdown
 */
export function downloadMemoAsMarkdown(memo: Memo) {
  const markdown = exportMemoToMarkdown(memo);
  const filename = `${memo.title || 'memo'}-${Date.now()}.md`;
  downloadFile(markdown, filename, 'text/markdown');
}

/**
 * Export and download multiple memos as a single Markdown file
 */
export function downloadMemosAsMarkdown(memos: Memo[], filename: string = 'memos.md') {
  const markdown = memos
    .map(memo => exportMemoToMarkdown(memo))
    .join('\n\n---\n\n');
  downloadFile(markdown, filename, 'text/markdown');
}

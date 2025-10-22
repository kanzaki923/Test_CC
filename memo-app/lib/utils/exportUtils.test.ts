import { exportToJSON, exportToMarkdown, exportMemosToJSON, exportMemoToMarkdown } from './exportUtils';
import type { Memo } from '@/lib/types';

describe('exportUtils', () => {
  const mockMemo: Memo = {
    id: '1',
    title: 'Test Memo',
    content: '# Hello World\n\nThis is a **test** memo.',
    categoryId: 'cat1',
    tags: ['important', 'work'],
    isPinned: false,
    isDeleted: false,
    createdAt: 1634567890000,
    updatedAt: 1634567890000,
    deletedAt: null,
  };

  const mockMemo2: Memo = {
    id: '2',
    title: 'Another Memo',
    content: 'Simple content',
    categoryId: null,
    tags: ['personal'],
    isPinned: true,
    isDeleted: false,
    createdAt: 1634567800000,
    updatedAt: 1634567800000,
    deletedAt: null,
  };

  describe('exportToJSON', () => {
    it('exports single memo to JSON string', () => {
      const json = exportToJSON(mockMemo);
      const parsed = JSON.parse(json);

      expect(parsed.id).toBe('1');
      expect(parsed.title).toBe('Test Memo');
      expect(parsed.content).toBe('# Hello World\n\nThis is a **test** memo.');
      expect(parsed.tags).toEqual(['important', 'work']);
    });

    it('preserves all memo properties', () => {
      const json = exportToJSON(mockMemo);
      const parsed = JSON.parse(json);

      expect(parsed.isPinned).toBe(false);
      expect(parsed.isDeleted).toBe(false);
      expect(parsed.createdAt).toBe(1634567890000);
      expect(parsed.updatedAt).toBe(1634567890000);
    });
  });

  describe('exportMemosToJSON', () => {
    it('exports multiple memos to JSON array', () => {
      const json = exportMemosToJSON([mockMemo, mockMemo2]);
      const parsed = JSON.parse(json);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe('1');
      expect(parsed[1].id).toBe('2');
    });

    it('exports empty array', () => {
      const json = exportMemosToJSON([]);
      const parsed = JSON.parse(json);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(0);
    });

    it('formats JSON with indentation', () => {
      const json = exportMemosToJSON([mockMemo]);
      expect(json).toContain('\n');
      expect(json).toContain('  ');
    });
  });

  describe('exportToMarkdown', () => {
    it('exports memo to Markdown format with title', () => {
      const markdown = exportToMarkdown(mockMemo);

      expect(markdown).toContain('# Test Memo');
      expect(markdown).toContain('# Hello World');
      expect(markdown).toContain('This is a **test** memo.');
    });

    it('includes metadata in frontmatter', () => {
      const markdown = exportToMarkdown(mockMemo);

      expect(markdown).toContain('---');
      expect(markdown).toContain('tags:');
      expect(markdown).toContain('- important');
      expect(markdown).toContain('- work');
      expect(markdown).toContain('created:');
      expect(markdown).toContain('updated:');
    });

    it('handles memo without tags', () => {
      const memoWithoutTags = { ...mockMemo, tags: [] };
      const markdown = exportToMarkdown(memoWithoutTags);

      expect(markdown).toContain('tags: []');
    });

    it('handles memo without title', () => {
      const memoWithoutTitle = { ...mockMemo, title: '' };
      const markdown = exportToMarkdown(memoWithoutTitle);

      expect(markdown).toContain('# Untitled');
    });
  });

  describe('exportMemoToMarkdown', () => {
    it('exports memo with title as heading', () => {
      const markdown = exportMemoToMarkdown(mockMemo);

      expect(markdown).toContain('# Test Memo');
      expect(markdown).toContain('# Hello World');
    });

    it('separates title and content with blank line', () => {
      const markdown = exportMemoToMarkdown(mockMemo);

      expect(markdown).toMatch(/# Test Memo\n\n---/);
    });

    it('includes metadata section', () => {
      const markdown = exportMemoToMarkdown(mockMemo);

      expect(markdown).toContain('**Tags:**');
      expect(markdown).toContain('important, work');
      expect(markdown).toContain('**Created:**');
      expect(markdown).toContain('**Updated:**');
    });

    it('handles pinned status', () => {
      const pinnedMemo = { ...mockMemo, isPinned: true };
      const markdown = exportMemoToMarkdown(pinnedMemo);

      expect(markdown).toContain('📌');
    });
  });
});

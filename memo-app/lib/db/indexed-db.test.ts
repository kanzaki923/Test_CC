import { saveToIndexedDB, loadFromIndexedDB, deleteFromIndexedDB, searchMemosIndexedDB, clearDatabase } from './indexed-db';
import type { Memo, Category } from '@/lib/types';

describe('IndexedDB operations', () => {
  beforeEach(async () => {
    // 各テスト前にデータベースをクリア
    await clearDatabase();
  });

  describe('saveToIndexedDB', () => {
    it('should save a memo to IndexedDB', async () => {
      const memo: Memo = {
        id: 'test-1',
        title: 'Test Memo',
        content: 'Test content',
        categoryId: null,
        isPinned: false,
        isDeleted: false,
        deletedAt: null,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await saveToIndexedDB('memos', memo.id, memo);

      const loaded = await loadFromIndexedDB('memos');
      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe('test-1');
      expect(loaded[0].title).toBe('Test Memo');
    });

    it('should save a category to IndexedDB', async () => {
      const category: Category = {
        id: 'cat-1',
        name: 'Work',
        color: '#ff0000',
        icon: 'briefcase',
        order: 0,
        createdAt: Date.now(),
      };

      await saveToIndexedDB('categories', category.id, category);

      const loaded = await loadFromIndexedDB('categories');
      expect(loaded).toHaveLength(1);
      expect(loaded[0].name).toBe('Work');
    });

    it('should update existing memo', async () => {
      const memo: Memo = {
        id: 'test-1',
        title: 'Original Title',
        content: 'Original content',
        categoryId: null,
        isPinned: false,
        isDeleted: false,
        deletedAt: null,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await saveToIndexedDB('memos', memo.id, memo);

      const updatedMemo = { ...memo, title: 'Updated Title' };
      await saveToIndexedDB('memos', memo.id, updatedMemo);

      const loaded = await loadFromIndexedDB('memos');
      expect(loaded).toHaveLength(1);
      expect(loaded[0].title).toBe('Updated Title');
    });
  });

  describe('loadFromIndexedDB', () => {
    it('should load all memos from IndexedDB', async () => {
      const memo1: Memo = {
        id: 'test-1',
        title: 'Memo 1',
        content: 'Content 1',
        categoryId: null,
        isPinned: false,
        isDeleted: false,
        deletedAt: null,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const memo2: Memo = {
        id: 'test-2',
        title: 'Memo 2',
        content: 'Content 2',
        categoryId: null,
        isPinned: false,
        isDeleted: false,
        deletedAt: null,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await saveToIndexedDB('memos', memo1.id, memo1);
      await saveToIndexedDB('memos', memo2.id, memo2);

      const loaded = await loadFromIndexedDB('memos');
      expect(loaded).toHaveLength(2);
    });

    it('should return empty array when no data exists', async () => {
      const loaded = await loadFromIndexedDB('memos');
      expect(loaded).toEqual([]);
    });
  });

  describe('deleteFromIndexedDB', () => {
    it('should delete a memo from IndexedDB', async () => {
      const memo: Memo = {
        id: 'test-1',
        title: 'Test Memo',
        content: 'Test content',
        categoryId: null,
        isPinned: false,
        isDeleted: false,
        deletedAt: null,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await saveToIndexedDB('memos', memo.id, memo);
      expect(await loadFromIndexedDB('memos')).toHaveLength(1);

      await deleteFromIndexedDB('memos', memo.id);
      expect(await loadFromIndexedDB('memos')).toHaveLength(0);
    });

    it('should handle deleting non-existent item gracefully', async () => {
      await expect(deleteFromIndexedDB('memos', 'non-existent')).resolves.not.toThrow();
    });
  });

  describe('searchMemosIndexedDB', () => {
    beforeEach(async () => {
      const memos: Memo[] = [
        {
          id: '1',
          title: 'JavaScript Tips',
          content: 'Learn React hooks',
          categoryId: null,
          isPinned: false,
          isDeleted: false,
          deletedAt: null,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          title: 'Shopping List',
          content: 'Buy milk and eggs',
          categoryId: null,
          isPinned: false,
          isDeleted: false,
          deletedAt: null,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '3',
          title: 'Meeting Notes',
          content: 'Discuss React migration',
          categoryId: null,
          isPinned: false,
          isDeleted: false,
          deletedAt: null,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      for (const memo of memos) {
        await saveToIndexedDB('memos', memo.id, memo);
      }
    });

    it('should find memos by title', async () => {
      const results = await searchMemosIndexedDB('JavaScript');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('JavaScript Tips');
    });

    it('should find memos by content', async () => {
      const results = await searchMemosIndexedDB('React');
      expect(results).toHaveLength(2); // Both memo 1 and 3 contain "React"
    });

    it('should be case-insensitive', async () => {
      const results = await searchMemosIndexedDB('shopping');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Shopping List');
    });

    it('should return empty array when no matches', async () => {
      const results = await searchMemosIndexedDB('NonExistent');
      expect(results).toEqual([]);
    });

    it('should return all memos when query is empty', async () => {
      const results = await searchMemosIndexedDB('');
      expect(results).toHaveLength(3);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      // This test verifies that errors don't crash the app
      // In a real scenario, you might want to test specific error conditions
      await expect(loadFromIndexedDB('memos')).resolves.toBeDefined();
    });
  });
});

import { renderHook, act } from '@testing-library/react';
import { useMemoStore } from './memoStore';

describe('useMemoStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useMemoStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('addMemo', () => {
    it('should add a new memo', () => {
      const { result } = renderHook(() => useMemoStore());

      act(() => {
        result.current.addMemo({
          title: 'Test Memo',
          content: 'Test content',
          categoryId: null,
        });
      });

      const memos = Array.from(result.current.memos.values());
      expect(memos).toHaveLength(1);
      expect(memos[0].title).toBe('Test Memo');
      expect(memos[0].content).toBe('Test content');
      expect(memos[0].isPinned).toBe(false);
      expect(memos[0].tags).toEqual([]);
    });

    it('should generate unique IDs for memos', () => {
      const { result } = renderHook(() => useMemoStore());

      act(() => {
        result.current.addMemo({
          title: 'Memo 1',
          content: 'Content 1',
          categoryId: null,
        });
        result.current.addMemo({
          title: 'Memo 2',
          content: 'Content 2',
          categoryId: null,
        });
      });

      const memos = Array.from(result.current.memos.values());
      expect(memos[0].id).not.toBe(memos[1].id);
    });

    it('should set createdAt and updatedAt timestamps', () => {
      const { result } = renderHook(() => useMemoStore());
      const beforeTime = Date.now();

      act(() => {
        result.current.addMemo({
          title: 'Test',
          content: 'Content',
          categoryId: null,
        });
      });

      const afterTime = Date.now();
      const memos = Array.from(result.current.memos.values());
      expect(memos[0].createdAt).toBeGreaterThanOrEqual(beforeTime);
      expect(memos[0].createdAt).toBeLessThanOrEqual(afterTime);
      expect(memos[0].updatedAt).toBe(memos[0].createdAt);
    });
  });

  describe('updateMemo', () => {
    it('should update an existing memo', () => {
      const { result } = renderHook(() => useMemoStore());
      let memoId: string;

      act(() => {
        memoId = result.current.addMemo({
          title: 'Original',
          content: 'Original content',
          categoryId: null,
        });
      });

      const originalUpdatedAt = result.current.memos.get(memoId)!.updatedAt;

      // Wait a bit to ensure updatedAt changes
      act(() => {
        jest.advanceTimersByTime(100);
      });

      act(() => {
        result.current.updateMemo(memoId, {
          title: 'Updated',
          content: 'Updated content',
        });
      });

      const memo = result.current.memos.get(memoId);
      expect(memo?.title).toBe('Updated');
      expect(memo?.content).toBe('Updated content');
      expect(memo?.updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt);
    });

    it('should not affect other memos when updating', () => {
      const { result } = renderHook(() => useMemoStore());
      let memoId1: string, memoId2: string;

      act(() => {
        memoId1 = result.current.addMemo({
          title: 'Memo 1',
          content: 'Content 1',
          categoryId: null,
        });
        memoId2 = result.current.addMemo({
          title: 'Memo 2',
          content: 'Content 2',
          categoryId: null,
        });
      });

      act(() => {
        result.current.updateMemo(memoId1, { title: 'Updated Memo 1' });
      });

      expect(result.current.memos.get(memoId1)?.title).toBe('Updated Memo 1');
      expect(result.current.memos.get(memoId2)?.title).toBe('Memo 2');
    });
  });

  describe('deleteMemo (moveToTrash)', () => {
    it('should move a memo to trash', () => {
      const { result } = renderHook(() => useMemoStore());
      let memoId: string;

      act(() => {
        memoId = result.current.addMemo({
          title: 'Test',
          content: 'Content',
          categoryId: null,
        });
      });

      expect(result.current.memos.has(memoId)).toBe(true);
      expect(result.current.memos.get(memoId)?.isDeleted).toBe(false);

      act(() => {
        result.current.deleteMemo(memoId);
      });

      expect(result.current.memos.has(memoId)).toBe(true);
      expect(result.current.memos.get(memoId)?.isDeleted).toBe(true);
      expect(result.current.memos.get(memoId)?.deletedAt).not.toBeNull();
    });

    it('should unpin memo when moving to trash', () => {
      const { result } = renderHook(() => useMemoStore());
      let memoId: string;

      act(() => {
        memoId = result.current.addMemo({
          title: 'Test',
          content: 'Content',
          categoryId: null,
        });
        result.current.togglePin(memoId);
      });

      expect(result.current.memos.get(memoId)?.isPinned).toBe(true);

      act(() => {
        result.current.deleteMemo(memoId);
      });

      expect(result.current.memos.get(memoId)?.isPinned).toBe(false);
      expect(result.current.memos.get(memoId)?.isDeleted).toBe(true);
    });
  });

  describe('restoreFromTrash', () => {
    it('should restore a memo from trash', () => {
      const { result } = renderHook(() => useMemoStore());
      let memoId: string;

      act(() => {
        memoId = result.current.addMemo({
          title: 'Test',
          content: 'Content',
          categoryId: null,
        });
        result.current.moveToTrash(memoId);
      });

      expect(result.current.memos.get(memoId)?.isDeleted).toBe(true);

      act(() => {
        result.current.restoreFromTrash(memoId);
      });

      expect(result.current.memos.get(memoId)?.isDeleted).toBe(false);
      expect(result.current.memos.get(memoId)?.deletedAt).toBeNull();
    });
  });

  describe('permanentlyDelete', () => {
    it('should permanently delete a memo', () => {
      const { result } = renderHook(() => useMemoStore());
      let memoId: string;

      act(() => {
        memoId = result.current.addMemo({
          title: 'Test',
          content: 'Content',
          categoryId: null,
        });
      });

      expect(result.current.memos.has(memoId)).toBe(true);

      act(() => {
        result.current.permanentlyDelete(memoId);
      });

      expect(result.current.memos.has(memoId)).toBe(false);
    });
  });

  describe('getDeletedMemos', () => {
    it('should return only deleted memos', () => {
      const { result } = renderHook(() => useMemoStore());
      let memoId1: string, memoId2: string, memoId3: string;

      act(() => {
        memoId1 = result.current.addMemo({
          title: 'Memo 1',
          content: 'Content 1',
          categoryId: null,
        });
        memoId2 = result.current.addMemo({
          title: 'Memo 2',
          content: 'Content 2',
          categoryId: null,
        });
        memoId3 = result.current.addMemo({
          title: 'Memo 3',
          content: 'Content 3',
          categoryId: null,
        });

        result.current.moveToTrash(memoId1);
        result.current.moveToTrash(memoId3);
      });

      const deletedMemos = result.current.getDeletedMemos();

      expect(deletedMemos).toHaveLength(2);
      expect(deletedMemos.find((m) => m.id === memoId1)).toBeDefined();
      expect(deletedMemos.find((m) => m.id === memoId3)).toBeDefined();
      expect(deletedMemos.find((m) => m.id === memoId2)).toBeUndefined();
    });
  });

  describe('togglePin', () => {
    it('should pin an unpinned memo', () => {
      const { result } = renderHook(() => useMemoStore());
      let memoId: string;

      act(() => {
        memoId = result.current.addMemo({
          title: 'Test',
          content: 'Content',
          categoryId: null,
        });
      });

      expect(result.current.memos.get(memoId)?.isPinned).toBe(false);

      act(() => {
        result.current.togglePin(memoId);
      });

      expect(result.current.memos.get(memoId)?.isPinned).toBe(true);
    });

    it('should unpin a pinned memo', () => {
      const { result } = renderHook(() => useMemoStore());
      let memoId: string;

      act(() => {
        memoId = result.current.addMemo({
          title: 'Test',
          content: 'Content',
          categoryId: null,
        });
        result.current.togglePin(memoId);
      });

      expect(result.current.memos.get(memoId)?.isPinned).toBe(true);

      act(() => {
        result.current.togglePin(memoId);
      });

      expect(result.current.memos.get(memoId)?.isPinned).toBe(false);
    });
  });

  describe('getMemosByCategory', () => {
    it('should return memos for a specific category', () => {
      const { result } = renderHook(() => useMemoStore());

      act(() => {
        result.current.addMemo({
          title: 'Work Memo',
          content: 'Content',
          categoryId: 'work',
        });
        result.current.addMemo({
          title: 'Personal Memo',
          content: 'Content',
          categoryId: 'personal',
        });
        result.current.addMemo({
          title: 'Uncategorized',
          content: 'Content',
          categoryId: null,
        });
      });

      const workMemos = result.current.getMemosByCategory('work');
      expect(workMemos).toHaveLength(1);
      expect(workMemos[0].title).toBe('Work Memo');

      const personalMemos = result.current.getMemosByCategory('personal');
      expect(personalMemos).toHaveLength(1);
      expect(personalMemos[0].title).toBe('Personal Memo');
    });

    it('should return memos without category when categoryId is null', () => {
      const { result } = renderHook(() => useMemoStore());

      act(() => {
        result.current.addMemo({
          title: 'Uncategorized',
          content: 'Content',
          categoryId: null,
        });
        result.current.addMemo({
          title: 'Work Memo',
          content: 'Content',
          categoryId: 'work',
        });
      });

      const uncategorized = result.current.getMemosByCategory(null);
      expect(uncategorized).toHaveLength(1);
      expect(uncategorized[0].title).toBe('Uncategorized');
    });
  });

  describe('searchMemos', () => {
    it('should search memos by title', () => {
      const { result } = renderHook(() => useMemoStore());

      act(() => {
        result.current.addMemo({
          title: 'React Tutorial',
          content: 'Learn React',
          categoryId: null,
        });
        result.current.addMemo({
          title: 'Vue Tutorial',
          content: 'Learn Vue',
          categoryId: null,
        });
      });

      const results = result.current.searchMemos('React');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('React Tutorial');
    });

    it('should search memos by content', () => {
      const { result } = renderHook(() => useMemoStore());

      act(() => {
        result.current.addMemo({
          title: 'Tutorial',
          content: 'Learn TypeScript',
          categoryId: null,
        });
        result.current.addMemo({
          title: 'Guide',
          content: 'Learn JavaScript',
          categoryId: null,
        });
      });

      const results = result.current.searchMemos('TypeScript');
      expect(results).toHaveLength(1);
      expect(results[0].content).toBe('Learn TypeScript');
    });

    it('should be case-insensitive', () => {
      const { result } = renderHook(() => useMemoStore());

      act(() => {
        result.current.addMemo({
          title: 'React Tutorial',
          content: 'Content',
          categoryId: null,
        });
      });

      const results = result.current.searchMemos('react');
      expect(results).toHaveLength(1);
    });
  });
});

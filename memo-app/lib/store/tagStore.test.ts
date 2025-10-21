import { renderHook, act } from '@testing-library/react';
import { useTagStore } from './tagStore';
import { useMemoStore } from './memoStore';
import { clearDatabase } from '../db/indexed-db';

describe('useTagStore', () => {
  beforeEach(async () => {
    // Reset stores
    useTagStore.setState({ tags: new Map() });
    useMemoStore.setState({ memos: new Map() });

    // Clear IndexedDB
    await clearDatabase();
  });

  describe('Tag CRUD operations', () => {
    it('should add a new tag', () => {
      const { result } = renderHook(() => useTagStore());

      let id: string;
      act(() => {
        id = result.current.addTag('Work', '#3b82f6');
      });

      const tag = result.current.tags.get(id!);
      expect(tag).toBeDefined();
      expect(tag?.name).toBe('Work');
      expect(tag?.color).toBe('#3b82f6');
      expect(tag?.createdAt).toBeDefined();
    });

    it('should not add duplicate tag names', () => {
      const { result } = renderHook(() => useTagStore());

      let id1: string, id2: string;
      act(() => {
        id1 = result.current.addTag('Work', '#3b82f6');
        id2 = result.current.addTag('Work', '#ef4444');
      });

      expect(id1!).toBe(id2!);
      expect(result.current.tags.size).toBe(1);
    });

    it('should update a tag', () => {
      const { result } = renderHook(() => useTagStore());

      let id: string;
      act(() => {
        id = result.current.addTag('Work', '#3b82f6');
      });

      act(() => {
        result.current.updateTag(id!, { name: 'Business', color: '#10b981' });
      });

      const tag = result.current.tags.get(id!);
      expect(tag?.name).toBe('Business');
      expect(tag?.color).toBe('#10b981');
    });

    it('should delete a tag', () => {
      const { result } = renderHook(() => useTagStore());

      act(() => {
        const id = result.current.addTag('Work', '#3b82f6');
        result.current.deleteTag(id);

        expect(result.current.tags.has(id)).toBe(false);
      });
    });

    it('should get all tags as array', () => {
      const { result } = renderHook(() => useTagStore());

      act(() => {
        result.current.addTag('Work', '#3b82f6');
        result.current.addTag('Personal', '#ef4444');
        result.current.addTag('Ideas', '#f59e0b');
      });

      const tags = result.current.getAllTags();
      expect(tags).toHaveLength(3);
      expect(tags.map(t => t.name).sort()).toEqual(['Ideas', 'Personal', 'Work']);
    });
  });

  describe('Tag usage tracking', () => {
    it('should track tag usage count', () => {
      const { result: tagResult } = renderHook(() => useTagStore());
      const { result: memoResult } = renderHook(() => useMemoStore());

      let tagId: string;
      act(() => {
        tagId = tagResult.current.addTag('Work', '#3b82f6');
      });

      const tag = tagResult.current.tags.get(tagId!);

      act(() => {
        memoResult.current.addMemo({
          title: 'Memo 1',
          content: 'Content 1',
          categoryId: null,
          tags: [tag!.name],
        });

        memoResult.current.addMemo({
          title: 'Memo 2',
          content: 'Content 2',
          categoryId: null,
          tags: [tag!.name],
        });
      });

      const count = tagResult.current.getTagUsageCount(tag!.name);
      expect(count).toBe(2);
    });

    it('should return 0 for unused tags', () => {
      const { result } = renderHook(() => useTagStore());

      act(() => {
        result.current.addTag('Unused', '#3b82f6');
        const count = result.current.getTagUsageCount('Unused');
        expect(count).toBe(0);
      });
    });

    it('should get tags sorted by usage', () => {
      const { result: tagResult } = renderHook(() => useTagStore());
      const { result: memoResult } = renderHook(() => useMemoStore());

      act(() => {
        tagResult.current.addTag('Work', '#3b82f6');
        tagResult.current.addTag('Personal', '#ef4444');
        tagResult.current.addTag('Ideas', '#f59e0b');
      });

      act(() => {
        memoResult.current.addMemo({
          title: 'Memo 1',
          content: 'Content 1',
          categoryId: null,
          tags: ['Work'],
        });

        memoResult.current.addMemo({
          title: 'Memo 2',
          content: 'Content 2',
          categoryId: null,
          tags: ['Work', 'Personal'],
        });

        memoResult.current.addMemo({
          title: 'Memo 3',
          content: 'Content 3',
          categoryId: null,
          tags: ['Personal'],
        });
      });

      const sortedTags = tagResult.current.getTagsSortedByUsage();
      // Work: 2 uses, Personal: 2 uses, Ideas: 0 uses
      // Same usage count sorted by name: Personal < Work
      expect(sortedTags.map(t => t.name)).toEqual(['Personal', 'Work', 'Ideas']);
    });
  });

  describe('IndexedDB persistence', () => {
    it('should save tags to IndexedDB when added', async () => {
      const { result } = renderHook(() => useTagStore());

      await act(async () => {
        result.current.addTag('Work', '#3b82f6');
      });

      // Reset store
      useTagStore.setState({ tags: new Map() });

      // Hydrate from IndexedDB
      await act(async () => {
        await result.current.hydrate();
      });

      const tags = result.current.getAllTags();
      expect(tags).toHaveLength(1);
      expect(tags[0].name).toBe('Work');
    });

    it('should update IndexedDB when tag is updated', async () => {
      const { result } = renderHook(() => useTagStore());

      let tagId: string;
      await act(async () => {
        tagId = result.current.addTag('Work', '#3b82f6');
        result.current.updateTag(tagId, { name: 'Business' });
      });

      // Reset store
      useTagStore.setState({ tags: new Map() });

      // Hydrate from IndexedDB
      await act(async () => {
        await result.current.hydrate();
      });

      const tags = result.current.getAllTags();
      expect(tags[0].name).toBe('Business');
    });

    it('should remove from IndexedDB when tag is deleted', async () => {
      const { result } = renderHook(() => useTagStore());

      let tagId: string;
      await act(async () => {
        tagId = result.current.addTag('Work', '#3b82f6');
        result.current.deleteTag(tagId);
      });

      // Reset store
      useTagStore.setState({ tags: new Map() });

      // Hydrate from IndexedDB
      await act(async () => {
        await result.current.hydrate();
      });

      const tags = result.current.getAllTags();
      expect(tags).toHaveLength(0);
    });
  });

  describe('Tag cleanup', () => {
    it('should delete tag when deleting and removing from all memos', () => {
      const { result: tagResult } = renderHook(() => useTagStore());
      const { result: memoResult } = renderHook(() => useMemoStore());

      let tagId: string;
      let memoId: string;

      act(() => {
        tagId = tagResult.current.addTag('Work', '#3b82f6');
      });

      const tag = tagResult.current.tags.get(tagId!);

      act(() => {
        memoId = memoResult.current.addMemo({
          title: 'Memo 1',
          content: 'Content 1',
          categoryId: null,
          tags: [tag!.name, 'Other'],
        });
      });

      act(() => {
        tagResult.current.deleteTagAndRemoveFromMemos(tag!.name);
      });

      expect(tagResult.current.tags.has(tagId!)).toBe(false);

      const memo = memoResult.current.memos.get(memoId!);
      expect(memo?.tags).toEqual(['Other']);
    });
  });
});

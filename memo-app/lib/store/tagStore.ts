import { create } from 'zustand';
import { Tag } from '../types';
import { saveToIndexedDB, loadFromIndexedDB, deleteFromIndexedDB } from '../db/indexed-db';
import { useMemoStore } from './memoStore';

interface TagStore {
  tags: Map<string, Tag>;
  addTag: (name: string, color: string) => string;
  updateTag: (id: string, updates: Partial<Omit<Tag, 'id' | 'createdAt'>>) => void;
  deleteTag: (id: string) => void;
  getAllTags: () => Tag[];
  getTagUsageCount: (tagName: string) => number;
  getTagsSortedByUsage: () => Tag[];
  deleteTagAndRemoveFromMemos: (tagName: string) => void;
  hydrate: () => Promise<void>;
}

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const useTagStore = create<TagStore>((set, get) => ({
  tags: new Map(),

  addTag: (name: string, color: string) => {
    // Check if tag with same name already exists
    const existingTag = Array.from(get().tags.values()).find(
      (tag) => tag.name.toLowerCase() === name.toLowerCase()
    );

    if (existingTag) {
      return existingTag.id;
    }

    const id = generateId();
    const tag: Tag = {
      id,
      name,
      color,
      createdAt: Date.now(),
    };

    set((state) => {
      const newTags = new Map(state.tags);
      newTags.set(id, tag);
      return { tags: newTags };
    });

    // Save to IndexedDB (async, don't block)
    saveToIndexedDB('tags', id, tag).catch((error) => {
      console.error('Failed to save tag to IndexedDB:', error);
    });

    return id;
  },

  updateTag: (id: string, updates: Partial<Omit<Tag, 'id' | 'createdAt'>>) => {
    const tag = get().tags.get(id);
    if (!tag) return;

    const updatedTag = { ...tag, ...updates };

    set((state) => {
      const newTags = new Map(state.tags);
      newTags.set(id, updatedTag);
      return { tags: newTags };
    });

    // Update in IndexedDB (async, don't block)
    saveToIndexedDB('tags', id, updatedTag).catch((error) => {
      console.error('Failed to update tag in IndexedDB:', error);
    });
  },

  deleteTag: (id: string) => {
    set((state) => {
      const newTags = new Map(state.tags);
      newTags.delete(id);
      return { tags: newTags };
    });

    // Delete from IndexedDB (async, don't block)
    deleteFromIndexedDB('tags', id).catch((error) => {
      console.error('Failed to delete tag from IndexedDB:', error);
    });
  },

  getAllTags: () => {
    return Array.from(get().tags.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  },

  getTagUsageCount: (tagName: string) => {
    const memos = useMemoStore.getState().memos;
    let count = 0;

    for (const memo of memos.values()) {
      if (!memo.isDeleted && memo.tags.includes(tagName)) {
        count++;
      }
    }

    return count;
  },

  getTagsSortedByUsage: () => {
    const tags = get().getAllTags();
    return tags.sort((a, b) => {
      const countA = get().getTagUsageCount(a.name);
      const countB = get().getTagUsageCount(b.name);

      // First sort by usage count (descending)
      if (countB !== countA) {
        return countB - countA;
      }

      // If usage count is same, sort by name (ascending)
      return a.name.localeCompare(b.name);
    });
  },

  deleteTagAndRemoveFromMemos: (tagName: string) => {
    // Find and delete the tag
    const tag = Array.from(get().tags.values()).find(
      (t) => t.name === tagName
    );

    if (tag) {
      get().deleteTag(tag.id);
    }

    // Remove tag from all memos
    const memoStore = useMemoStore.getState();
    const memos = Array.from(memoStore.memos.values());

    memos.forEach((memo) => {
      if (memo.tags.includes(tagName)) {
        const newTags = memo.tags.filter((t) => t !== tagName);
        memoStore.updateMemo(memo.id, { tags: newTags });
      }
    });
  },

  hydrate: async () => {
    const result = await loadFromIndexedDB('tags');

    if (result.success && result.data) {
      const tagsMap = new Map<string, Tag>();

      for (const tag of result.data) {
        tagsMap.set(tag.id, tag);
      }

      set({ tags: tagsMap });
    }
  },
}));

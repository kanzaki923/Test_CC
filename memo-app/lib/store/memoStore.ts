import { create } from 'zustand';
import { Memo } from '@/lib/types';
import { saveToIndexedDB, loadFromIndexedDB, deleteFromIndexedDB } from '@/lib/db/indexed-db';
import { generateId } from '@/lib/utils/id';

interface MemoInput {
  title: string;
  content: string;
  categoryId: string | null;
  tags?: string[];
}

interface MemoStore {
  memos: Map<string, Memo>;
  addMemo: (input: MemoInput) => string;
  updateMemo: (id: string, updates: Partial<Omit<Memo, 'id' | 'createdAt'>>) => void;
  deleteMemo: (id: string) => void;
  moveToTrash: (id: string) => void;
  restoreFromTrash: (id: string) => void;
  permanentlyDelete: (id: string) => void;
  emptyTrash: () => void;
  cleanupOldTrash: (daysOld?: number) => void;
  togglePin: (id: string) => void;
  getMemosByCategory: (categoryId: string | null) => Memo[];
  getDeletedMemos: () => Memo[];
  searchMemos: (query: string) => Memo[];
  hydrate: () => Promise<void>;
  reset: () => void;
}

export const useMemoStore = create<MemoStore>((set, get) => ({
  memos: new Map(),

  addMemo: (input) => {
    const id = generateId();
    const now = Date.now();

    const newMemo: Memo = {
      id,
      title: input.title,
      content: input.content,
      categoryId: input.categoryId,
      tags: input.tags || [],
      isPinned: false,
      isDeleted: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => {
      const newMemos = new Map(state.memos);
      newMemos.set(id, newMemo);
      return { memos: newMemos };
    });

    // 非同期でIndexedDBに保存（UIはブロックしない）
    saveToIndexedDB('memos', id, newMemo).catch((error) => {
      console.error('Failed to save memo to IndexedDB:', error);
    });

    return id;
  },

  updateMemo: (id, updates) => {
    set((state) => {
      const memo = state.memos.get(id);
      if (!memo) return state;

      const updatedMemo = {
        ...memo,
        ...updates,
        updatedAt: Date.now(),
      };

      const newMemos = new Map(state.memos);
      newMemos.set(id, updatedMemo);

      // 非同期でIndexedDBに保存
      saveToIndexedDB('memos', id, updatedMemo).catch((error) => {
        console.error('Failed to update memo in IndexedDB:', error);
      });

      return { memos: newMemos };
    });
  },

  deleteMemo: (id) => {
    // deleteMemo is now an alias for moveToTrash for backward compatibility
    get().moveToTrash(id);
  },

  moveToTrash: (id) => {
    set((state) => {
      const memo = state.memos.get(id);
      if (!memo) return state;

      const updatedMemo = {
        ...memo,
        isDeleted: true,
        deletedAt: Date.now(),
        isPinned: false, // Unpin when moving to trash
        updatedAt: Date.now(),
      };

      const newMemos = new Map(state.memos);
      newMemos.set(id, updatedMemo);

      // IndexedDBも更新
      saveToIndexedDB('memos', id, updatedMemo).catch((error) => {
        console.error('Failed to move memo to trash in IndexedDB:', error);
      });

      return { memos: newMemos };
    });
  },

  restoreFromTrash: (id) => {
    set((state) => {
      const memo = state.memos.get(id);
      if (!memo) return state;

      const updatedMemo = {
        ...memo,
        isDeleted: false,
        deletedAt: null,
        updatedAt: Date.now(),
      };

      const newMemos = new Map(state.memos);
      newMemos.set(id, updatedMemo);

      // IndexedDBも更新
      saveToIndexedDB('memos', id, updatedMemo).catch((error) => {
        console.error('Failed to restore memo from trash in IndexedDB:', error);
      });

      return { memos: newMemos };
    });
  },

  permanentlyDelete: (id) => {
    set((state) => {
      const newMemos = new Map(state.memos);
      newMemos.delete(id);
      return { memos: newMemos };
    });

    // IndexedDBからも削除
    deleteFromIndexedDB('memos', id).catch((error) => {
      console.error('Failed to permanently delete memo from IndexedDB:', error);
    });
  },

  emptyTrash: () => {
    const { memos } = get();
    const deletedMemoIds: string[] = [];

    // Find all deleted memos
    memos.forEach((memo, id) => {
      if (memo.isDeleted) {
        deletedMemoIds.push(id);
      }
    });

    // Permanently delete all deleted memos
    set((state) => {
      const newMemos = new Map(state.memos);
      deletedMemoIds.forEach((id) => {
        newMemos.delete(id);
        // Delete from IndexedDB
        deleteFromIndexedDB('memos', id).catch((error) => {
          console.error('Failed to delete memo from IndexedDB:', error);
        });
      });
      return { memos: newMemos };
    });
  },

  cleanupOldTrash: (daysOld = 30) => {
    const { memos } = get();
    const now = Date.now();
    const cutoffTime = now - daysOld * 24 * 60 * 60 * 1000; // Convert days to ms
    const oldMemoIds: string[] = [];

    // Find memos that have been in trash for more than daysOld days
    memos.forEach((memo, id) => {
      if (memo.isDeleted && memo.deletedAt && memo.deletedAt < cutoffTime) {
        oldMemoIds.push(id);
      }
    });

    // Permanently delete old memos
    set((state) => {
      const newMemos = new Map(state.memos);
      oldMemoIds.forEach((id) => {
        newMemos.delete(id);
        // Delete from IndexedDB
        deleteFromIndexedDB('memos', id).catch((error) => {
          console.error('Failed to delete old memo from IndexedDB:', error);
        });
      });
      return { memos: newMemos };
    });
  },

  togglePin: (id) => {
    set((state) => {
      const memo = state.memos.get(id);
      if (!memo) return state;

      const updatedMemo = {
        ...memo,
        isPinned: !memo.isPinned,
        updatedAt: Date.now(),
      };

      const newMemos = new Map(state.memos);
      newMemos.set(id, updatedMemo);

      // IndexedDBも更新
      saveToIndexedDB('memos', id, updatedMemo).catch((error) => {
        console.error('Failed to update pin status in IndexedDB:', error);
      });

      return { memos: newMemos };
    });
  },

  getMemosByCategory: (categoryId) => {
    const { memos } = get();
    return Array.from(memos.values()).filter(
      (memo) => memo.categoryId === categoryId && !memo.isDeleted
    );
  },

  getDeletedMemos: () => {
    const { memos } = get();
    return Array.from(memos.values()).filter((memo) => memo.isDeleted);
  },

  searchMemos: (query) => {
    const { memos } = get();
    const lowerQuery = query.toLowerCase();

    return Array.from(memos.values()).filter(
      (memo) =>
        !memo.isDeleted &&
        (memo.title.toLowerCase().includes(lowerQuery) ||
          memo.content.toLowerCase().includes(lowerQuery))
    );
  },

  hydrate: async () => {
    const result = await loadFromIndexedDB('memos');
    if (result.success && result.data) {
      const memosMap = new Map(result.data.map((memo) => [memo.id, memo]));
      set({ memos: memosMap });
    }
  },

  reset: () => {
    set({ memos: new Map() });
  },
}));

import { create } from 'zustand';
import { Memo } from '@/lib/types';
import { saveToIndexedDB, loadFromIndexedDB, deleteFromIndexedDB } from '@/lib/db/indexed-db';

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
  togglePin: (id: string) => void;
  getMemosByCategory: (categoryId: string | null) => Memo[];
  searchMemos: (query: string) => Memo[];
  hydrate: () => Promise<void>;
  reset: () => void;
}

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

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
    set((state) => {
      const newMemos = new Map(state.memos);
      newMemos.delete(id);
      return { memos: newMemos };
    });

    // IndexedDBからも削除
    deleteFromIndexedDB('memos', id).catch((error) => {
      console.error('Failed to delete memo from IndexedDB:', error);
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
      (memo) => memo.categoryId === categoryId
    );
  },

  searchMemos: (query) => {
    const { memos } = get();
    const lowerQuery = query.toLowerCase();

    return Array.from(memos.values()).filter(
      (memo) =>
        memo.title.toLowerCase().includes(lowerQuery) ||
        memo.content.toLowerCase().includes(lowerQuery)
    );
  },

  hydrate: async () => {
    try {
      const memos = await loadFromIndexedDB('memos');
      const memosMap = new Map(memos.map((memo) => [memo.id, memo]));
      set({ memos: memosMap });
    } catch (error) {
      console.error('Failed to hydrate memos from IndexedDB:', error);
    }
  },

  reset: () => {
    set({ memos: new Map() });
  },
}));

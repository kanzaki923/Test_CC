import { create } from 'zustand';
import { Memo } from '@/lib/types';

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

    return id;
  },

  updateMemo: (id, updates) => {
    set((state) => {
      const memo = state.memos.get(id);
      if (!memo) return state;

      const newMemos = new Map(state.memos);
      newMemos.set(id, {
        ...memo,
        ...updates,
        updatedAt: Date.now(),
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
  },

  togglePin: (id) => {
    set((state) => {
      const memo = state.memos.get(id);
      if (!memo) return state;

      const newMemos = new Map(state.memos);
      newMemos.set(id, {
        ...memo,
        isPinned: !memo.isPinned,
        updatedAt: Date.now(),
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

  reset: () => {
    set({ memos: new Map() });
  },
}));

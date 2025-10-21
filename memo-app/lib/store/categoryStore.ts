import { create } from 'zustand';
import { Category } from '@/lib/types';
import { saveToIndexedDB, loadFromIndexedDB, deleteFromIndexedDB } from '@/lib/db/indexed-db';
import { generateId } from '@/lib/utils/id';

interface CategoryInput {
  name: string;
  color: string;
  icon?: string;
}

interface CategoryStore {
  categories: Map<string, Category>;
  addCategory: (input: CategoryInput) => string;
  updateCategory: (id: string, updates: Partial<Omit<Category, 'id' | 'createdAt' | 'order'>>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (orderedIds: string[]) => void;
  getCategoriesSorted: () => Category[];
  hydrate: () => Promise<void>;
  reset: () => void;
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  categories: new Map(),

  addCategory: (input) => {
    const id = generateId();
    const { categories } = get();
    const maxOrder = Math.max(-1, ...Array.from(categories.values()).map((c) => c.order));

    const newCategory: Category = {
      id,
      name: input.name,
      color: input.color,
      icon: input.icon,
      order: maxOrder + 1,
      createdAt: Date.now(),
    };

    set((state) => {
      const newCategories = new Map(state.categories);
      newCategories.set(id, newCategory);
      return { categories: newCategories };
    });

    // IndexedDBに保存
    saveToIndexedDB('categories', id, newCategory).catch((error) => {
      console.error('Failed to save category to IndexedDB:', error);
    });

    return id;
  },

  updateCategory: (id, updates) => {
    set((state) => {
      const category = state.categories.get(id);
      if (!category) return state;

      const updatedCategory = {
        ...category,
        ...updates,
      };

      const newCategories = new Map(state.categories);
      newCategories.set(id, updatedCategory);

      // IndexedDBに保存
      saveToIndexedDB('categories', id, updatedCategory).catch((error) => {
        console.error('Failed to update category in IndexedDB:', error);
      });

      return { categories: newCategories };
    });
  },

  deleteCategory: (id) => {
    set((state) => {
      const newCategories = new Map(state.categories);
      newCategories.delete(id);
      return { categories: newCategories };
    });

    // IndexedDBからも削除
    deleteFromIndexedDB('categories', id).catch((error) => {
      console.error('Failed to delete category from IndexedDB:', error);
    });
  },

  reorderCategories: (orderedIds) => {
    set((state) => {
      const newCategories = new Map(state.categories);
      const updates: Promise<void>[] = [];

      orderedIds.forEach((id, index) => {
        const category = newCategories.get(id);
        if (category) {
          const updatedCategory = {
            ...category,
            order: index,
          };
          newCategories.set(id, updatedCategory);

          // IndexedDBに保存
          updates.push(
            saveToIndexedDB('categories', id, updatedCategory).catch((error) => {
              console.error('Failed to update category order in IndexedDB:', error);
            })
          );
        }
      });

      return { categories: newCategories };
    });
  },

  getCategoriesSorted: () => {
    const { categories } = get();
    return Array.from(categories.values()).sort((a, b) => a.order - b.order);
  },

  hydrate: async () => {
    const result = await loadFromIndexedDB('categories');
    if (result.success && result.data) {
      const categoriesMap = new Map(result.data.map((category) => [category.id, category]));
      set({ categories: categoriesMap });
    }
  },

  reset: () => {
    set({ categories: new Map() });
  },
}));

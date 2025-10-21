import { create } from 'zustand';
import { Category } from '@/lib/types';

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
  reset: () => void;
}

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

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

    return id;
  },

  updateCategory: (id, updates) => {
    set((state) => {
      const category = state.categories.get(id);
      if (!category) return state;

      const newCategories = new Map(state.categories);
      newCategories.set(id, {
        ...category,
        ...updates,
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
  },

  reorderCategories: (orderedIds) => {
    set((state) => {
      const newCategories = new Map(state.categories);

      orderedIds.forEach((id, index) => {
        const category = newCategories.get(id);
        if (category) {
          newCategories.set(id, {
            ...category,
            order: index,
          });
        }
      });

      return { categories: newCategories };
    });
  },

  getCategoriesSorted: () => {
    const { categories } = get();
    return Array.from(categories.values()).sort((a, b) => a.order - b.order);
  },

  reset: () => {
    set({ categories: new Map() });
  },
}));

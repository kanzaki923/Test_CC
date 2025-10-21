import { create } from 'zustand';
import { SortBy, SortOrder, ViewMode } from '@/lib/types';

interface UIStore {
  selectedMemoId: string | null;
  selectedCategoryId: string | null;
  selectedTagNames: string[];
  searchQuery: string;
  viewMode: ViewMode;
  sortBy: SortBy;
  sortOrder: SortOrder;
  isSidebarOpen: boolean;
  isTrashView: boolean;

  setSelectedMemoId: (id: string | null) => void;
  setSelectedCategoryId: (id: string | null) => void;
  setSelectedTagNames: (tagNames: string[]) => void;
  toggleTagFilter: (tagName: string) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setSortBy: (sortBy: SortBy) => void;
  setSortOrder: (order: SortOrder) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTrashView: (isTrash: boolean) => void;
  reset: () => void;
}

const initialState = {
  selectedMemoId: null,
  selectedCategoryId: null,
  selectedTagNames: [] as string[],
  searchQuery: '',
  viewMode: 'list' as ViewMode,
  sortBy: 'updatedAt' as SortBy,
  sortOrder: 'desc' as SortOrder,
  isSidebarOpen: true,
  isTrashView: false,
};

export const useUIStore = create<UIStore>((set) => ({
  ...initialState,

  setSelectedMemoId: (id) => set({ selectedMemoId: id }),
  setSelectedCategoryId: (id) => set({ selectedCategoryId: id, isTrashView: false }),
  setSelectedTagNames: (tagNames) => set({ selectedTagNames: tagNames }),
  toggleTagFilter: (tagName) =>
    set((state) => {
      const isSelected = state.selectedTagNames.includes(tagName);
      return {
        selectedTagNames: isSelected
          ? state.selectedTagNames.filter((t) => t !== tagName)
          : [...state.selectedTagNames, tagName],
      };
    }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (order) => set({ sortOrder: order }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setTrashView: (isTrash) => set({ isTrashView: isTrash, selectedCategoryId: null }),
  reset: () => set(initialState),
}));

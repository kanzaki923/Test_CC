import { create } from 'zustand';
import { SortBy, SortOrder, ViewMode } from '@/lib/types';

interface UIStore {
  selectedMemoId: string | null;
  selectedCategoryId: string | null;
  searchQuery: string;
  viewMode: ViewMode;
  sortBy: SortBy;
  sortOrder: SortOrder;
  isSidebarOpen: boolean;

  setSelectedMemoId: (id: string | null) => void;
  setSelectedCategoryId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setSortBy: (sortBy: SortBy) => void;
  setSortOrder: (order: SortOrder) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  reset: () => void;
}

const initialState = {
  selectedMemoId: null,
  selectedCategoryId: null,
  searchQuery: '',
  viewMode: 'list' as ViewMode,
  sortBy: 'updatedAt' as SortBy,
  sortOrder: 'desc' as SortOrder,
  isSidebarOpen: true,
};

export const useUIStore = create<UIStore>((set) => ({
  ...initialState,

  setSelectedMemoId: (id) => set({ selectedMemoId: id }),
  setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (order) => set({ sortOrder: order }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  reset: () => set(initialState),
}));

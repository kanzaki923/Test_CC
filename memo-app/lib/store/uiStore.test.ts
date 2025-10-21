import { renderHook, act } from '@testing-library/react';
import { useUIStore } from './uiStore';

describe('useUIStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useUIStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('selectedMemoId', () => {
    it('should start with null', () => {
      const { result } = renderHook(() => useUIStore());
      expect(result.current.selectedMemoId).toBeNull();
    });

    it('should set selected memo ID', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setSelectedMemoId('memo-1');
      });

      expect(result.current.selectedMemoId).toBe('memo-1');
    });

    it('should clear selected memo ID', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setSelectedMemoId('memo-1');
        result.current.setSelectedMemoId(null);
      });

      expect(result.current.selectedMemoId).toBeNull();
    });
  });

  describe('selectedCategoryId', () => {
    it('should start with null', () => {
      const { result } = renderHook(() => useUIStore());
      expect(result.current.selectedCategoryId).toBeNull();
    });

    it('should set selected category ID', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setSelectedCategoryId('category-1');
      });

      expect(result.current.selectedCategoryId).toBe('category-1');
    });

    it('should clear selected category ID', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setSelectedCategoryId('category-1');
        result.current.setSelectedCategoryId(null);
      });

      expect(result.current.selectedCategoryId).toBeNull();
    });
  });

  describe('searchQuery', () => {
    it('should start with empty string', () => {
      const { result } = renderHook(() => useUIStore());
      expect(result.current.searchQuery).toBe('');
    });

    it('should set search query', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setSearchQuery('test query');
      });

      expect(result.current.searchQuery).toBe('test query');
    });

    it('should clear search query', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setSearchQuery('test query');
        result.current.setSearchQuery('');
      });

      expect(result.current.searchQuery).toBe('');
    });
  });

  describe('viewMode', () => {
    it('should start with list view', () => {
      const { result } = renderHook(() => useUIStore());
      expect(result.current.viewMode).toBe('list');
    });

    it('should set view mode', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setViewMode('grid');
      });

      expect(result.current.viewMode).toBe('grid');
    });

    it('should switch between view modes', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setViewMode('grid');
      });
      expect(result.current.viewMode).toBe('grid');

      act(() => {
        result.current.setViewMode('compact');
      });
      expect(result.current.viewMode).toBe('compact');

      act(() => {
        result.current.setViewMode('list');
      });
      expect(result.current.viewMode).toBe('list');
    });
  });

  describe('sortBy', () => {
    it('should start with updatedAt', () => {
      const { result } = renderHook(() => useUIStore());
      expect(result.current.sortBy).toBe('updatedAt');
    });

    it('should set sort by', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setSortBy('title');
      });

      expect(result.current.sortBy).toBe('title');
    });
  });

  describe('sortOrder', () => {
    it('should start with desc', () => {
      const { result } = renderHook(() => useUIStore());
      expect(result.current.sortOrder).toBe('desc');
    });

    it('should set sort order', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setSortOrder('asc');
      });

      expect(result.current.sortOrder).toBe('asc');
    });
  });

  describe('isSidebarOpen', () => {
    it('should start with true', () => {
      const { result } = renderHook(() => useUIStore());
      expect(result.current.isSidebarOpen).toBe(true);
    });

    it('should toggle sidebar', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.toggleSidebar();
      });
      expect(result.current.isSidebarOpen).toBe(false);

      act(() => {
        result.current.toggleSidebar();
      });
      expect(result.current.isSidebarOpen).toBe(true);
    });

    it('should set sidebar state directly', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setSidebarOpen(false);
      });
      expect(result.current.isSidebarOpen).toBe(false);

      act(() => {
        result.current.setSidebarOpen(true);
      });
      expect(result.current.isSidebarOpen).toBe(true);
    });
  });
});

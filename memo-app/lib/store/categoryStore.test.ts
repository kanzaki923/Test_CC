import { renderHook, act } from '@testing-library/react';
import { useCategoryStore } from './categoryStore';

describe('useCategoryStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useCategoryStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('addCategory', () => {
    it('should add a new category', () => {
      const { result } = renderHook(() => useCategoryStore());

      act(() => {
        result.current.addCategory({
          name: 'Work',
          color: '#ff0000',
        });
      });

      const categories = Array.from(result.current.categories.values());
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Work');
      expect(categories[0].color).toBe('#ff0000');
    });

    it('should generate unique IDs for categories', () => {
      const { result } = renderHook(() => useCategoryStore());

      act(() => {
        result.current.addCategory({ name: 'Work', color: '#ff0000' });
        result.current.addCategory({ name: 'Personal', color: '#00ff00' });
      });

      const categories = Array.from(result.current.categories.values());
      expect(categories[0].id).not.toBe(categories[1].id);
    });

    it('should set createdAt timestamp', () => {
      const { result } = renderHook(() => useCategoryStore());
      const beforeTime = Date.now();

      act(() => {
        result.current.addCategory({ name: 'Work', color: '#ff0000' });
      });

      const afterTime = Date.now();
      const categories = Array.from(result.current.categories.values());
      expect(categories[0].createdAt).toBeGreaterThanOrEqual(beforeTime);
      expect(categories[0].createdAt).toBeLessThanOrEqual(afterTime);
    });

    it('should auto-increment order for new categories', () => {
      const { result } = renderHook(() => useCategoryStore());

      act(() => {
        result.current.addCategory({ name: 'Work', color: '#ff0000' });
        result.current.addCategory({ name: 'Personal', color: '#00ff00' });
        result.current.addCategory({ name: 'Study', color: '#0000ff' });
      });

      const categories = Array.from(result.current.categories.values());
      expect(categories[0].order).toBe(0);
      expect(categories[1].order).toBe(1);
      expect(categories[2].order).toBe(2);
    });
  });

  describe('updateCategory', () => {
    it('should update an existing category', () => {
      const { result } = renderHook(() => useCategoryStore());
      let categoryId: string;

      act(() => {
        categoryId = result.current.addCategory({
          name: 'Work',
          color: '#ff0000',
        });
      });

      act(() => {
        result.current.updateCategory(categoryId, {
          name: 'Updated Work',
          color: '#00ff00',
        });
      });

      const category = result.current.categories.get(categoryId);
      expect(category?.name).toBe('Updated Work');
      expect(category?.color).toBe('#00ff00');
    });

    it('should not affect other categories when updating', () => {
      const { result } = renderHook(() => useCategoryStore());
      let categoryId1: string, categoryId2: string;

      act(() => {
        categoryId1 = result.current.addCategory({
          name: 'Work',
          color: '#ff0000',
        });
        categoryId2 = result.current.addCategory({
          name: 'Personal',
          color: '#00ff00',
        });
      });

      act(() => {
        result.current.updateCategory(categoryId1, { name: 'Updated Work' });
      });

      expect(result.current.categories.get(categoryId1)?.name).toBe('Updated Work');
      expect(result.current.categories.get(categoryId2)?.name).toBe('Personal');
    });
  });

  describe('deleteCategory', () => {
    it('should delete a category', () => {
      const { result } = renderHook(() => useCategoryStore());
      let categoryId: string;

      act(() => {
        categoryId = result.current.addCategory({
          name: 'Work',
          color: '#ff0000',
        });
      });

      expect(result.current.categories.has(categoryId)).toBe(true);

      act(() => {
        result.current.deleteCategory(categoryId);
      });

      expect(result.current.categories.has(categoryId)).toBe(false);
    });

    it('should not affect other categories when deleting', () => {
      const { result } = renderHook(() => useCategoryStore());
      let categoryId1: string, categoryId2: string;

      act(() => {
        categoryId1 = result.current.addCategory({
          name: 'Work',
          color: '#ff0000',
        });
        categoryId2 = result.current.addCategory({
          name: 'Personal',
          color: '#00ff00',
        });
      });

      act(() => {
        result.current.deleteCategory(categoryId1);
      });

      expect(result.current.categories.has(categoryId1)).toBe(false);
      expect(result.current.categories.has(categoryId2)).toBe(true);
    });
  });

  describe('reorderCategories', () => {
    it('should reorder categories', () => {
      const { result } = renderHook(() => useCategoryStore());
      let categoryIds: string[];

      act(() => {
        categoryIds = [
          result.current.addCategory({ name: 'Work', color: '#ff0000' }),
          result.current.addCategory({ name: 'Personal', color: '#00ff00' }),
          result.current.addCategory({ name: 'Study', color: '#0000ff' }),
        ];
      });

      // Reorder: [0, 1, 2] -> [2, 0, 1]
      act(() => {
        result.current.reorderCategories([categoryIds[2], categoryIds[0], categoryIds[1]]);
      });

      expect(result.current.categories.get(categoryIds[2])?.order).toBe(0);
      expect(result.current.categories.get(categoryIds[0])?.order).toBe(1);
      expect(result.current.categories.get(categoryIds[1])?.order).toBe(2);
    });
  });

  describe('getCategoriesSorted', () => {
    it('should return categories sorted by order', () => {
      const { result } = renderHook(() => useCategoryStore());

      act(() => {
        result.current.addCategory({ name: 'Work', color: '#ff0000' });
        result.current.addCategory({ name: 'Personal', color: '#00ff00' });
        result.current.addCategory({ name: 'Study', color: '#0000ff' });
      });

      const sorted = result.current.getCategoriesSorted();
      expect(sorted[0].name).toBe('Work');
      expect(sorted[1].name).toBe('Personal');
      expect(sorted[2].name).toBe('Study');
      expect(sorted[0].order).toBeLessThan(sorted[1].order);
      expect(sorted[1].order).toBeLessThan(sorted[2].order);
    });
  });
});

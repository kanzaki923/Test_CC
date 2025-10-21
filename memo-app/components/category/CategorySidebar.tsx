"use client";

import { Button } from "@/components/ui/Button";
import { Plus, FolderOpen, Trash2 } from "lucide-react";
import { useCategoryStore } from "@/lib/store/categoryStore";
import { useMemoStore } from "@/lib/store/memoStore";
import { useUIStore } from "@/lib/store/uiStore";
import { useMemo } from "react";
import { cn } from "@/lib/utils/cn";

export function CategorySidebar() {
  const categories = useCategoryStore((state) => state.categories);
  const getCategoriesSorted = useCategoryStore((state) => state.getCategoriesSorted);
  const addCategory = useCategoryStore((state) => state.addCategory);

  const memos = useMemoStore((state) => state.memos);

  const selectedCategoryId = useUIStore((state) => state.selectedCategoryId);
  const setSelectedCategoryId = useUIStore((state) => state.setSelectedCategoryId);
  const isTrashView = useUIStore((state) => state.isTrashView);
  const setTrashView = useUIStore((state) => state.setTrashView);

  // Calculate memo counts by category
  const memoCounts = useMemo(() => {
    const counts = new Map<string | null, number>();
    let total = 0;
    let trashCount = 0;

    Array.from(memos.values()).forEach((memo) => {
      if (memo.isDeleted) {
        trashCount++;
      } else {
        const count = counts.get(memo.categoryId) || 0;
        counts.set(memo.categoryId, count + 1);
        total++;
      }
    });

    return { counts, total, trashCount };
  }, [memos]);

  const sortedCategories = getCategoriesSorted();

  const handleAddCategory = () => {
    const name = prompt('カテゴリ名を入力してください');
    if (name && name.trim()) {
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      addCategory({ name: name.trim(), color });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background" data-tour="categories">
      {/* ヘッダー */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">カテゴリ</h2>
          <Button size="icon" variant="ghost" onClick={handleAddCategory}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* カテゴリリスト */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        {/* すべてのメモ */}
        <button
          onClick={() => setSelectedCategoryId(null)}
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent transition-colors",
            selectedCategoryId === null && !isTrashView && "bg-accent"
          )}
        >
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">すべてのメモ</span>
          </div>
          <span className="text-xs text-muted-foreground">{memoCounts.total}</span>
        </button>

        <div className="border-t border-border my-2" />

        {/* カテゴリ */}
        {sortedCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategoryId(category.id)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent transition-colors",
              selectedCategoryId === category.id && !isTrashView && "bg-accent"
            )}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span>{category.icon} {category.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {memoCounts.counts.get(category.id) || 0}
            </span>
          </button>
        ))}

        {sortedCategories.length === 0 && (
          <div className="px-4 py-3 text-sm text-muted-foreground">
            カテゴリがありません
          </div>
        )}

        <div className="border-t border-border my-2" />

        {/* ゴミ箱 */}
        <button
          onClick={() => setTrashView(true)}
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent transition-colors",
            isTrashView && "bg-accent"
          )}
        >
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-muted-foreground" />
            <span>ゴミ箱</span>
          </div>
          <span className="text-xs text-muted-foreground">{memoCounts.trashCount}</span>
        </button>
      </div>
    </div>
  );
}

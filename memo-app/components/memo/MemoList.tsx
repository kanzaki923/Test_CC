"use client";

import { MemoCard } from "./MemoCard";
import { useMemoStore } from "@/lib/store/memoStore";
import { useUIStore } from "@/lib/store/uiStore";
import { useMemo } from "react";

interface MemoListProps {
  selectedMemoId: string | null;
  onSelectMemo: (id: string) => void;
}

export function MemoList({ selectedMemoId, onSelectMemo }: MemoListProps) {
  // Get memos from store
  const memos = useMemoStore((state) => state.memos);
  const deleteMemo = useMemoStore((state) => state.deleteMemo);
  const togglePin = useMemoStore((state) => state.togglePin);
  const searchMemos = useMemoStore((state) => state.searchMemos);

  // Get UI state
  const searchQuery = useUIStore((state) => state.searchQuery);
  const sortBy = useUIStore((state) => state.sortBy);
  const sortOrder = useUIStore((state) => state.sortOrder);
  const selectedCategoryId = useUIStore((state) => state.selectedCategoryId);

  // Filter and sort memos
  const filteredMemos = useMemo(() => {
    let memosArray = Array.from(memos.values());

    // Filter by search query
    if (searchQuery.trim()) {
      memosArray = searchMemos(searchQuery);
    }

    // Filter by category if selected
    if (selectedCategoryId !== null) {
      memosArray = memosArray.filter(
        (memo) => memo.categoryId === selectedCategoryId
      );
    }

    // Sort memos
    memosArray.sort((a, b) => {
      let compareResult = 0;

      switch (sortBy) {
        case "title":
          compareResult = a.title.localeCompare(b.title);
          break;
        case "createdAt":
          compareResult = a.createdAt - b.createdAt;
          break;
        case "updatedAt":
        default:
          compareResult = a.updatedAt - b.updatedAt;
          break;
      }

      return sortOrder === "asc" ? compareResult : -compareResult;
    });

    // Put pinned memos first
    const pinnedMemos = memosArray.filter((memo) => memo.isPinned);
    const unpinnedMemos = memosArray.filter((memo) => !memo.isPinned);

    return [...pinnedMemos, ...unpinnedMemos];
  }, [memos, searchQuery, searchMemos, selectedCategoryId, sortBy, sortOrder]);

  const handleDelete = (id: string) => {
    if (confirm('このメモを削除しますか？')) {
      deleteMemo(id);
      if (selectedMemoId === id) {
        onSelectMemo(filteredMemos[0]?.id || '');
      }
    }
  };

  const handlePin = (id: string) => {
    togglePin(id);
  };

  return (
    <div className="h-full overflow-auto scrollbar-thin bg-background">
      {filteredMemos.length === 0 ? (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <p>メモがありません。新規作成してください。</p>
        </div>
      ) : (
        <div>
          {filteredMemos.map((memo) => (
            <MemoCard
              key={memo.id}
              memo={memo}
              isSelected={selectedMemoId === memo.id}
              onClick={() => onSelectMemo(memo.id)}
              onDelete={() => handleDelete(memo.id)}
              onPin={() => handlePin(memo.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

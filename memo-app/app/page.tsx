"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CategorySidebar } from "@/components/category/CategorySidebar";
import { MemoList } from "@/components/memo/MemoList";
import { MemoEditor } from "@/components/memo/MemoEditor";
import { TagList } from "@/components/tag/TagList";
import { Plus, Search } from "lucide-react";
import { useMemoStore } from "@/lib/store/memoStore";
import { useTagStore } from "@/lib/store/tagStore";
import { useUIStore } from "@/lib/store/uiStore";
import { useInitializeData } from "@/lib/hooks/useInitializeData";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { useToastStore } from "@/lib/store/toastStore";
import { useRef, useMemo } from "react";

export default function Home() {
  // Initialize default data
  useInitializeData();

  // Ref for search input
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get state from stores
  const addMemo = useMemoStore((state) => state.addMemo);
  const tagsMap = useTagStore((state) => state.tags);
  const getTagUsageCount = useTagStore((state) => state.getTagUsageCount);

  // Sort tags by usage count (memoized to avoid infinite loop)
  const tags = useMemo(() => {
    const allTags = Array.from(tagsMap.values());
    return allTags.sort((a, b) => {
      const countA = getTagUsageCount(a.name);
      const countB = getTagUsageCount(b.name);

      // First sort by usage count (descending)
      if (countB !== countA) {
        return countB - countA;
      }

      // If usage count is same, sort by name (ascending)
      return a.name.localeCompare(b.name);
    });
  }, [tagsMap, getTagUsageCount]);

  const selectedMemoId = useUIStore((state) => state.selectedMemoId);
  const setSelectedMemoId = useUIStore((state) => state.setSelectedMemoId);
  const selectedTagNames = useUIStore((state) => state.selectedTagNames);
  const toggleTagFilter = useUIStore((state) => state.toggleTagFilter);
  const searchQuery = useUIStore((state) => state.searchQuery);
  const setSearchQuery = useUIStore((state) => state.setSearchQuery);
  const sortBy = useUIStore((state) => state.sortBy);
  const setSortBy = useUIStore((state) => state.setSortBy);
  const addToast = useToastStore((state) => state.addToast);

  const handleNewMemo = () => {
    const id = addMemo({
      title: '新規メモ',
      content: '',
      categoryId: null,
    });
    setSelectedMemoId(id);
    addToast({
      message: '新しいメモを作成しました',
      type: 'success',
      duration: 2000,
    });
  };

  const handleFocusSearch = () => {
    searchInputRef.current?.focus();
  };

  const handleClearSelection = () => {
    setSelectedMemoId(null);
  };

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    'mod+n': handleNewMemo,
    'mod+k': handleFocusSearch,
    'escape': handleClearSelection,
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* カテゴリサイドバー（デスクトップのみ） */}
      <aside className="hidden md:block w-64 border-r border-border">
        <CategorySidebar />
      </aside>

      {/* メインコンテンツエリア */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* ツールバー */}
        <div className="p-4 border-b border-border flex items-center gap-4 bg-background">
          <Button size="sm" data-tour="new-memo" onClick={handleNewMemo}>
            <Plus className="h-4 w-4 mr-2" />
            新規メモ
          </Button>

          <div className="flex-1 relative" data-tour="search">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="search"
              placeholder="メモを検索... (Cmd+K)"
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <select
              className="h-9 px-3 rounded-md border border-input bg-background text-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="updatedAt">更新日時</option>
              <option value="createdAt">作成日時</option>
              <option value="title">タイトル</option>
            </select>
          </div>
        </div>

        {/* タグフィルター */}
        {tags.length > 0 && (
          <div className="px-4 py-3 border-b border-border bg-background">
            <div className="text-xs font-semibold text-muted-foreground mb-2">タグでフィルター</div>
            <TagList
              tags={tags}
              selectedTagNames={selectedTagNames}
              onTagClick={toggleTagFilter}
              showCount={true}
              getTagCount={getTagUsageCount}
            />
          </div>
        )}

        {/* コンテンツエリア */}
        <div className="flex-1 flex overflow-hidden">
          {/* メモリスト */}
          <div className="w-full lg:w-1/2 border-r border-border overflow-hidden" data-tour="memo-list">
            <MemoList
              selectedMemoId={selectedMemoId}
              onSelectMemo={setSelectedMemoId}
            />
          </div>

          {/* メモエディタ（デスクトップのみ） */}
          <div className="hidden lg:block flex-1 overflow-hidden">
            <MemoEditor memoId={selectedMemoId} />
          </div>
        </div>
      </main>
    </div>
  );
}

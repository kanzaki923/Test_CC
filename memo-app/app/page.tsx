"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CategorySidebar } from "@/components/category/CategorySidebar";
import { MemoList } from "@/components/memo/MemoList";
import { MemoEditor } from "@/components/memo/MemoEditor";
import { TagList } from "@/components/tag/TagList";
import { Plus, Search, Download } from "lucide-react";
import { useMemoStore } from "@/lib/store/memoStore";
import { useTagStore } from "@/lib/store/tagStore";
import { useUIStore } from "@/lib/store/uiStore";
import { useInitializeData } from "@/lib/hooks/useInitializeData";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { useToastStore } from "@/lib/store/toastStore";
import { useRef, useMemo, useCallback, useState } from "react";
import { downloadMemosAsJSON, downloadMemosAsMarkdown, downloadMemoAsJSON, downloadMemoAsMarkdown } from "@/lib/utils/exportUtils";

export default function Home() {
  // Initialize default data
  useInitializeData();

  // Ref for search input
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Export menu state
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Get state from stores
  const addMemo = useMemoStore((state) => state.addMemo);
  const tagsMap = useTagStore((state) => state.tags);
  const memos = useMemoStore((state) => state.memos);

  const selectedMemoId = useUIStore((state) => state.selectedMemoId);
  const setSelectedMemoId = useUIStore((state) => state.setSelectedMemoId);
  const selectedTagNames = useUIStore((state) => state.selectedTagNames);
  const toggleTagFilter = useUIStore((state) => state.toggleTagFilter);
  const searchQuery = useUIStore((state) => state.searchQuery);
  const setSearchQuery = useUIStore((state) => state.setSearchQuery);
  const sortBy = useUIStore((state) => state.sortBy);
  const setSortBy = useUIStore((state) => state.setSortBy);
  const addToast = useToastStore((state) => state.addToast);

  // Sort tags by usage count (memoized to avoid infinite loop)
  const tags = useMemo(() => {
    const allTags = Array.from(tagsMap.values());

    // Calculate usage count inline
    const calculateUsageCount = (tagName: string) => {
      let count = 0;
      for (const memo of memos.values()) {
        if (!memo.isDeleted && memo.tags.includes(tagName)) {
          count++;
        }
      }
      return count;
    };

    return allTags.sort((a, b) => {
      const countA = calculateUsageCount(a.name);
      const countB = calculateUsageCount(b.name);

      // First sort by usage count (descending)
      if (countB !== countA) {
        return countB - countA;
      }

      // If usage count is same, sort by name (ascending)
      return a.name.localeCompare(b.name);
    });
  }, [tagsMap, memos]);

  // Memoized getTagUsageCount function for TagList component
  const getTagUsageCount = useCallback((tagName: string) => {
    let count = 0;
    for (const memo of memos.values()) {
      if (!memo.isDeleted && memo.tags.includes(tagName)) {
        count++;
      }
    }
    return count;
  }, [memos]);

  // Memoized event handlers to prevent keyboard shortcuts re-registration
  const handleNewMemo = useCallback(() => {
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
  }, [addMemo, setSelectedMemoId, addToast]);

  const handleFocusSearch = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedMemoId(null);
  }, [setSelectedMemoId]);

  // Export handlers
  const handleExportAllAsJSON = useCallback(() => {
    const allMemos = Array.from(memos.values()).filter(m => !m.isDeleted);
    downloadMemosAsJSON(allMemos);
    addToast({
      message: `${allMemos.length}件のメモをJSONでエクスポートしました`,
      type: 'success',
      duration: 3000,
    });
    setIsExportMenuOpen(false);
  }, [memos, addToast]);

  const handleExportAllAsMarkdown = useCallback(() => {
    const allMemos = Array.from(memos.values()).filter(m => !m.isDeleted);
    downloadMemosAsMarkdown(allMemos);
    addToast({
      message: `${allMemos.length}件のメモをMarkdownでエクスポートしました`,
      type: 'success',
      duration: 3000,
    });
    setIsExportMenuOpen(false);
  }, [memos, addToast]);

  const handleExportSelectedAsJSON = useCallback(() => {
    if (!selectedMemoId) return;
    const memo = memos.get(selectedMemoId);
    if (memo && !memo.isDeleted) {
      downloadMemoAsJSON(memo);
      addToast({
        message: 'メモをJSONでエクスポートしました',
        type: 'success',
        duration: 3000,
      });
      setIsExportMenuOpen(false);
    }
  }, [selectedMemoId, memos, addToast]);

  const handleExportSelectedAsMarkdown = useCallback(() => {
    if (!selectedMemoId) return;
    const memo = memos.get(selectedMemoId);
    if (memo && !memo.isDeleted) {
      downloadMemoAsMarkdown(memo);
      addToast({
        message: 'メモをMarkdownでエクスポートしました',
        type: 'success',
        duration: 3000,
      });
      setIsExportMenuOpen(false);
    }
  }, [selectedMemoId, memos, addToast]);

  // Memoize shortcuts object to prevent re-registration
  const shortcuts = useMemo(() => ({
    'mod+n': handleNewMemo,
    'mod+k': handleFocusSearch,
    'escape': handleClearSelection,
  }), [handleNewMemo, handleFocusSearch, handleClearSelection]);

  // Register keyboard shortcuts
  useKeyboardShortcuts(shortcuts);

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

            {/* Export Button with Dropdown */}
            <div className="relative">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              >
                <Download className="h-4 w-4 mr-2" />
                エクスポート
              </Button>

              {isExportMenuOpen && (
                <>
                  {/* Backdrop to close menu */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsExportMenuOpen(false)}
                  />

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-64 bg-background border border-border rounded-md shadow-lg z-20">
                    <div className="py-1">
                      <div className="px-4 py-2 text-xs font-semibold text-muted-foreground border-b border-border">
                        全メモをエクスポート
                      </div>
                      <button
                        onClick={handleExportAllAsJSON}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
                      >
                        JSON形式でエクスポート
                      </button>
                      <button
                        onClick={handleExportAllAsMarkdown}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
                      >
                        Markdown形式でエクスポート
                      </button>

                      {selectedMemoId && (
                        <>
                          <div className="px-4 py-2 text-xs font-semibold text-muted-foreground border-t border-border mt-1">
                            選択中のメモをエクスポート
                          </div>
                          <button
                            onClick={handleExportSelectedAsJSON}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
                          >
                            JSON形式でエクスポート
                          </button>
                          <button
                            onClick={handleExportSelectedAsMarkdown}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
                          >
                            Markdown形式でエクスポート
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
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
